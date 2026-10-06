# Arquitetura de Pagamentos — Plataforma de Eventos

Oct 5, 2026 · @Fernanda Santos Rabaçal

## Premissas e visão geral

A recomendação é um monolito modular em que a venda avulsa, as assinaturas e o split compartilham um único núcleo de cobrança. Cada fase só começa quando a anterior estiver completa, e cada fase nova entra como extensão, sem reescrever a anterior.

**Stack assumida.** Os exemplos usam TypeScript com Node e PostgreSQL. Os padrões valem para qualquer linguagem; troque a sintaxe e mantenha as ideias.

**Por que monolito modular, e não microsserviços.** A reserva de ingresso e a criação do pedido precisam acontecer na mesma transação de banco. Separar isso em serviços exigiria sagas e consistência eventual logo no começo, sem ganho real para um projeto deste tamanho. Com módulos bem isolados, extrair um serviço depois é uma tarefa mecânica.

**Três regras que sustentam tudo:**

1. Dinheiro é sempre inteiro em centavos (`bigint`), acompanhado da moeda.
2. Nenhum módulo lê as tabelas de outro. A comunicação é feita por uma interface pública ou por eventos.
3. Todo efeito colateral externo (cobrar, estornar, enviar e-mail) é idempotente e pode ser repetido sem dano.

| Fase | Entrega | Critério de pronto |
| --- | --- | --- |
| 1. Venda avulsa | Reserva, pagamento com cartão e Pix, emissão de ingresso, estornos e chargeback | Teste de concorrência sem overselling; webhooks duplicados e fora de ordem tratados; pagamento tardio estornado automaticamente |
| 2. Planos de membro | Assinatura do público com benefícios configuráveis | Renovação, retentativas e perda de benefício funcionando ponta a ponta |
| 3. Planos de organizador | Assinatura SaaS que define a taxa da plataforma | Taxa resolvida pelo plano e congelada em cada pedido |
| 4. Split | Repasse automático ao organizador | Ledger em partidas dobradas e conciliação diária sem divergências |

## Arquitetura: módulos e fronteiras

O módulo de cobrança fica no centro e não depende de nenhum outro. Vendas e assinaturas chamam a cobrança pela fachada pública, e a cobrança responde emitindo eventos que cada módulo escuta.

&#91;embedded content: módulos e dependências · 6 módulos\]

As setas sólidas são chamadas síncronas; as tracejadas são eventos gravados no outbox e entregues por uma fila. O módulo de eventos que você já tem fica fora do desenho: vendas apenas lê dele os dados do evento e dos tipos de ingresso.

**Regra de dependência.** Nenhuma seta sólida aponta para vendas ou assinaturas. Se um dia a cobrança precisar importar algo de vendas, é sinal de que a informação deveria viajar dentro do evento ou do comando.

## Modelagem de dados

A decisão central é que a tabela `charges` (cobranças) não aponta para pedidos nem para faturas. Ela guarda `origin_type` e `origin_id`, e é isso que permite que venda avulsa, assinatura de membro e plano de organizador usem o mesmo motor de cobrança.

Essa referência polimórfica não tem chave estrangeira, e isso é proposital: o módulo de cobrança não conhece as tabelas de vendas. A integridade é garantida pelo código do módulo dono da origem e por um índice único.

Cada tabela abaixo pertence a um módulo. Os comentários `-- Fase N` indicam quando ela entra.

### Vendas (Fase 1)

```sql
-- Fase 1
CREATE TABLE ticket_types (
  id                 uuid PRIMARY KEY,
  event_id           uuid NOT NULL,          -- módulo de eventos que já existe
  name               text NOT NULL,
  price_cents        bigint NOT NULL CHECK (price_cents >= 0),
  currency           char(3) NOT NULL DEFAULT 'BRL',
  quantity_total     int NOT NULL,
  quantity_reserved  int NOT NULL DEFAULT 0,
  quantity_sold      int NOT NULL DEFAULT 0,
  sales_start_at     timestamptz,
  sales_end_at       timestamptz,
  CHECK (quantity_reserved + quantity_sold <= quantity_total)
);

CREATE TABLE orders (
  id                   uuid PRIMARY KEY,
  buyer_id             uuid NOT NULL,
  event_id             uuid NOT NULL,
  status               text NOT NULL,      -- awaiting_payment | paid | expired | cancelled | refunded
  subtotal_cents       bigint NOT NULL,
  discount_cents       bigint NOT NULL DEFAULT 0,
  total_cents          bigint NOT NULL,
  platform_fee_cents   bigint NOT NULL DEFAULT 0,  -- snapshot; ganha uso na Fase 3
  currency             char(3) NOT NULL,
  expires_at           timestamptz NOT NULL,
  paid_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id                uuid PRIMARY KEY,
  order_id          uuid NOT NULL REFERENCES orders(id),
  ticket_type_id    uuid NOT NULL REFERENCES ticket_types(id),
  quantity          int NOT NULL CHECK (quantity > 0),
  unit_price_cents  bigint NOT NULL       -- preço congelado no momento da compra
);

CREATE TABLE tickets (
  id              uuid PRIMARY KEY,
  order_item_id   uuid NOT NULL REFERENCES order_items(id),
  code            text NOT NULL UNIQUE,  -- aleatório, vai no QR code
  status          text NOT NULL,         -- valid | used | cancelled
  used_at         timestamptz
);
```

### Cobrança (Fase 1)

```sql
-- Fase 1
CREATE TABLE charges (
  id                  uuid PRIMARY KEY,
  origin_type         text NOT NULL,     -- 'order' | 'invoice'
  origin_id           uuid NOT NULL,
  customer_id         uuid NOT NULL,
  amount_cents        bigint NOT NULL,
  currency            char(3) NOT NULL,
  method              text NOT NULL,     -- card | pix | pix_automatic
  status              text NOT NULL,     -- pending | authorized | succeeded | failed | cancelled | refunded | partially_refunded
  provider            text NOT NULL,     -- stripe | mercadopago | fake
  provider_charge_id  text,
  idempotency_key     text NOT NULL UNIQUE,
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_charge_id)
);
CREATE INDEX ON charges (origin_type, origin_id);

CREATE TABLE refunds (
  id                  uuid PRIMARY KEY,
  charge_id           uuid NOT NULL REFERENCES charges(id),
  amount_cents        bigint NOT NULL,
  reason              text NOT NULL,     -- buyer_request | event_cancelled | late_payment | duplicate
  status              text NOT NULL,     -- pending | succeeded | failed
  provider_refund_id  text,
  idempotency_key     text NOT NULL UNIQUE
);

CREATE TABLE disputes (
  id                   uuid PRIMARY KEY,
  charge_id            uuid NOT NULL REFERENCES charges(id),
  provider_dispute_id  text NOT NULL UNIQUE,
  status               text NOT NULL,    -- open | won | lost
  amount_cents         bigint NOT NULL,
  reason               text
);

CREATE TABLE webhook_events (
  id                 uuid PRIMARY KEY,
  provider           text NOT NULL,
  provider_event_id  text NOT NULL,
  type               text NOT NULL,
  payload            jsonb NOT NULL,
  received_at        timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz,
  attempts           int NOT NULL DEFAULT 0,
  last_error         text,
  UNIQUE (provider, provider_event_id)   -- deduplicação
);
```

### Infraestrutura compartilhada (Fase 1)

```sql
-- Fase 1: outbox, para gravar o evento na mesma transação da mudança de estado
CREATE TABLE outbox (
  id            uuid PRIMARY KEY,
  event_type    text NOT NULL,        -- ex.: 'billing.charge_succeeded'
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

CREATE TABLE processed_messages (     -- consumidores idempotentes
  consumer      text NOT NULL,
  message_id    uuid NOT NULL,
  PRIMARY KEY (consumer, message_id)
);
```

### Assinaturas e benefícios (Fases 2 e 3)

As mesmas tabelas servem para planos de membro e de organizador; o campo `audience` diferencia os dois.

```sql
-- Fase 2
CREATE TABLE plans (
  id            uuid PRIMARY KEY,
  audience      text NOT NULL,       -- 'member' (Fase 2) | 'organizer' (Fase 3)
  owner_id      uuid,                -- organizador dono do plano de membro; NULL = plano da plataforma
  name          text NOT NULL,
  price_cents   bigint NOT NULL,
  currency      char(3) NOT NULL,
  interval      text NOT NULL,       -- month | year
  active        boolean NOT NULL DEFAULT true
);

CREATE TABLE plan_benefits (
  id            uuid PRIMARY KEY,
  plan_id       uuid NOT NULL REFERENCES plans(id),
  benefit_type  text NOT NULL,       -- ticket_discount | presale_access | included_tickets | platform_fee | feature
  config        jsonb NOT NULL       -- ex.: {"percent": 20, "eventIds": null}
);

CREATE TABLE subscriptions (
  id                    uuid PRIMARY KEY,
  plan_id               uuid NOT NULL REFERENCES plans(id),
  subscriber_id         uuid NOT NULL,   -- usuário (membro) ou organizador
  status                text NOT NULL,   -- incomplete | active | past_due | cancelled | expired
  current_period_start  timestamptz NOT NULL,
  current_period_end    timestamptz NOT NULL,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,
  payment_method_ref    text            -- token do provedor, nunca o cartão
);

CREATE TABLE invoices (
  id               uuid PRIMARY KEY,
  subscription_id  uuid NOT NULL REFERENCES subscriptions(id),
  period_start     timestamptz NOT NULL,
  period_end       timestamptz NOT NULL,
  amount_cents     bigint NOT NULL,
  status           text NOT NULL,      -- open | paid | void | uncollectible
  attempt_count    int NOT NULL DEFAULT 0,
  next_attempt_at  timestamptz,
  UNIQUE (subscription_id, period_start)   -- impede fatura duplicada no mesmo período
);

-- Fase 2: benefícios materializados, lidos pelo módulo de vendas
CREATE TABLE entitlement_grants (
  id            uuid PRIMARY KEY,
  subject_id    uuid NOT NULL,         -- usuário ou organizador
  benefit_type  text NOT NULL,
  config        jsonb NOT NULL,
  scope_owner_id uuid,                 -- organizador onde o benefício vale
  valid_from    timestamptz NOT NULL,
  valid_until   timestamptz NOT NULL,
  source_type   text NOT NULL,         -- 'subscription' hoje; 'coupon' ou 'manual' no futuro
  source_id     uuid NOT NULL
);
CREATE INDEX ON entitlement_grants (subject_id, benefit_type, valid_until);

CREATE TABLE benefit_usages (          -- cota de ingressos inclusos
  grant_id   uuid NOT NULL REFERENCES entitlement_grants(id),
  order_id   uuid NOT NULL,
  quantity   int NOT NULL,
  PRIMARY KEY (grant_id, order_id)
);

CREATE TABLE order_adjustments (       -- vendas: descontos aplicados ao pedido
  id           uuid PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES orders(id),
  type         text NOT NULL,          -- member_discount | included_ticket | coupon
  amount_cents bigint NOT NULL,
  source_type  text NOT NULL,
  source_id    uuid NOT NULL
);
```

### Split e contabilidade (Fase 4)

```sql
-- Fase 4
CREATE TABLE recipients (
  id                     uuid PRIMARY KEY,
  organizer_id           uuid NOT NULL UNIQUE,
  provider               text NOT NULL,
  provider_recipient_id  text NOT NULL,
  status                 text NOT NULL   -- pending_kyc | active | blocked
);

CREATE TABLE charge_splits (
  id            uuid PRIMARY KEY,
  charge_id     uuid NOT NULL REFERENCES charges(id),
  recipient_id  uuid REFERENCES recipients(id),  -- NULL = plataforma
  role          text NOT NULL,                   -- organizer | platform
  amount_cents  bigint NOT NULL
);

CREATE TABLE ledger_transactions (
  id           uuid PRIMARY KEY,
  description  text NOT NULL,
  source_type  text NOT NULL,     -- charge | refund | dispute | payout
  source_id    uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, description)
);

CREATE TABLE ledger_entries (
  id              uuid PRIMARY KEY,
  transaction_id  uuid NOT NULL REFERENCES ledger_transactions(id),
  account         text NOT NULL,   -- ex.: 'organizer_payable:<id>', 'platform_revenue', 'gateway_fees'
  direction       text NOT NULL,   -- debit | credit
  amount_cents    bigint NOT NULL CHECK (amount_cents > 0)
);
-- Regra: em cada transaction_id, soma dos débitos = soma dos créditos
```

**Por que `entitlement_grants` é materializada.** O módulo de vendas pergunta apenas "este usuário tem desconto aqui?" e não precisa saber que o desconto veio de uma assinatura. Amanhã, um cupom ou um benefício concedido manualmente pelo organizador vira só outro `source_type`, sem tocar em vendas.

## Fase 1 — Venda avulsa

A venda avulsa é resolvida por cinco peças: reserva atômica, cobrança via porta de gateway, webhook idempotente, confirmação por evento e um job de expiração. Os casos de borda (pagamento tardio, estorno em lote, chargeback) saem naturalmente dessas peças.

### 1. Reserva atômica, sem overselling

O estoque é decrementado com um `UPDATE` condicional. Se duas pessoas disputam o último ingresso, o banco garante que só uma linha seja atualizada. Isso dispensa locks explícitos e escala bem.

```sql
UPDATE ticket_types
   SET quantity_reserved = quantity_reserved + $2
 WHERE id = $1
   AND quantity_total - quantity_sold - quantity_reserved >= $2
   AND now() BETWEEN sales_start_at AND sales_end_at
RETURNING id;
-- 0 linhas retornadas = esgotado ou fora da janela de venda
```

```ts
// sales/application/create-order.ts
export async function createOrder(cmd: CreateOrderCommand, deps: Deps) {
  return deps.db.transaction(async (tx) => {
    for (const item of cmd.items) {
      const ok = await deps.inventory.reserve(tx, item.ticketTypeId, item.quantity);
      if (!ok) throw new SoldOutError(item.ticketTypeId);
    }
    // preço SEMPRE calculado no servidor, nunca vindo do cliente
    const price = await deps.pricing.calculate(tx, cmd);
    return deps.orders.insert(tx, {
      ...price,
      status: 'awaiting_payment',
      expiresAt: addMinutes(now(), 10),
    });
  });
}
```

### 2. Cobrança atrás de uma porta (gateway port)

O domínio nunca importa o SDK do provedor. Ele conhece só esta interface, e cada provedor é um adaptador. Isso permite um `FakeGateway` nos testes e trocar Stripe por Mercado Pago sem mexer em regra de negócio.

```ts
// billing/domain/gateway-port.ts
export interface PaymentGateway {
  createCharge(input: {
    amountCents: number; currency: string; method: 'card' | 'pix';
    customerRef: string; paymentToken?: string; expiresAt?: Date;
    idempotencyKey: string;
  }): Promise<{ providerChargeId: string; status: ChargeStatus; pixQrCode?: string }>;
  getCharge(providerChargeId: string): Promise<{ status: ChargeStatus }>;
  cancelCharge(providerChargeId: string): Promise<void>;
  refund(input: { providerChargeId: string; amountCents: number; idempotencyKey: string }): Promise<{ providerRefundId: string }>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): WebhookEvent; // lança erro se assinatura inválida
}
```

A chave de idempotência é derivada do domínio, não gerada aleatoriamente a cada tentativa: `charge:order:<orderId>:<tentativa>`. Assim, um retry após timeout reaproveita a mesma chave e o provedor não cobra duas vezes.

No Pix, a expiração do QR code deve ser um pouco **menor** que a da reserva (por exemplo, 9 minutos para uma reserva de 10). Isso reduz, mas não elimina, o pagamento tardio.

### 3. Webhook: receber rápido, processar depois

```ts
// billing/infra/http/webhook-controller.ts
async function handleWebhook(req, res) {
  const event = gateway.verifyWebhook(req.rawBody, req.headers); // 401 se inválido

  // 1. Postgres primeiro: é a fonte da verdade
  const { rows } = await db.query(
    `INSERT INTO webhook_events (id, provider, provider_event_id, type, payload)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (provider, provider_event_id) DO NOTHING
     RETURNING id`,
    [uuid(), event.provider, event.id, event.type, event.payload],
  );

  // 2. Só então enfileira o ID no BullMQ (duplicata = nenhuma linha retornada)
  if (rows[0]) {
    await webhookQueue.add('process', { webhookEventId: rows[0].id }, {
      jobId: rows[0].id, // mesmo ID = BullMQ ignora a segunda inclusão
    });
  }

  res.status(200).end(); // responde em milissegundos; o worker faz o resto
}
```

O worker que processa `webhook_events` segue duas regras. Primeiro, **não confia no payload**: consulta `gateway.getCharge()` para obter o estado atual, o que resolve eventos fora de ordem. Segundo, aplica a transição pela máquina de estados e grava o evento de domínio no outbox **na mesma transação**.

### 3.1 Fila de processamento com BullMQ

O Redis entra no projeto apenas como backend do BullMQ, nunca como armazenamento. Tudo que envolve dinheiro é gravado no Postgres antes de virar job; se o Redis perder dados, um job de varredura reconstrói a fila a partir do banco.

**Filas do projeto.** Use uma fila por tipo de trabalho, para poder ajustar concorrência e tentativas separadamente:

| Fila | Job | Origem do job | Fase |
| --- | --- | --- | --- |
| `webhooks` | Processar um `webhook_events` | Controller de webhook | 1 |
| `domain-events` | Entregar um evento do outbox aos consumidores | Publicador do outbox | 1 |
| `order-expiration` | Expirar um pedido específico | Job atrasado criado junto com o pedido | 1 |
| `maintenance` | Varreduras e conciliação | Agendamento recorrente | 1 |
| `billing-cycle` | Gerar fatura e retentar cobrança | Agendamento recorrente | 2 |

**Worker com tentativas e backoff.**

```ts
// shared/queue/queues.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// maxRetriesPerRequest: null é exigido pelos Workers do BullMQ
export const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export const webhookQueue = new Queue('webhooks', {
  connection,
  defaultJobOptions: {
    attempts: 8,
    backoff: { type: 'exponential', delay: 2_000 }, // 2s, 4s, 8s...
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: false, // falhas definitivas ficam visíveis para análise
  },
});

// billing/infra/workers/webhook-worker.ts
new Worker('webhooks', async (job) => {
  const evt = await webhookEvents.findById(job.data.webhookEventId);
  if (evt.processedAt) return;                 // já processado: idempotente
  await processWebhookEvent(evt);              // getCharge + máquina de estados + outbox
  await webhookEvents.markProcessed(evt.id);
}, { connection, concurrency: 10 });
```

**Expiração com job atrasado.** Ao criar o pedido, agende um job com o atraso exato até `expires_at`. É mais preciso que um job a cada minuto e é um ótimo exercício de BullMQ.

```ts
await orderExpirationQueue.add('expire', { orderId: order.id }, {
  delay: order.expiresAt.getTime() - Date.now(),
  jobId: `expire-${order.id}`, // evite ':' em IDs customizados do BullMQ
});
```

**Varredura: a rede de segurança.** Um job recorrente na fila `maintenance`, a cada poucos minutos, faz três buscas no Postgres e reenfileira o que encontrar:

- `webhook_events` com `processed_at` nulo há mais de alguns minutos;
- linhas do `outbox` sem `published_at`;
- pedidos `awaiting_payment` com `expires_at` vencido (caso o job atrasado tenha se perdido).

Como todo job usa `jobId` determinístico e todo worker é idempotente, reenfileirar algo que já estava na fila não causa efeito duplo.

**Cuidados de configuração do Redis.** Configure `maxmemory-policy noeviction`, como recomenda a documentação do BullMQ: com outra política, o Redis pode descartar chaves da fila quando a memória enche. Acompanhe os jobs que esgotaram as tentativas (estado `failed`) com um painel como o Bull Board, e crie um alerta quando esse número crescer.

### 4. Máquina de estados explícita

```ts
// billing/domain/charge-state.ts
const transitions: Record<ChargeStatus, ChargeStatus[]> = {
  pending:            ['authorized', 'succeeded', 'failed', 'cancelled'],
  authorized:         ['succeeded', 'cancelled', 'failed'],
  succeeded:          ['partially_refunded', 'refunded'],
  partially_refunded: ['partially_refunded', 'refunded'],
  failed: [], cancelled: [], refunded: [],
};

export function transition(charge: Charge, to: ChargeStatus): DomainEvent[] {
  if (charge.status === to) return [];              // repetido: ignora (idempotência)
  if (!transitions[charge.status].includes(to)) {
    throw new InvalidTransition(charge.status, to); // ex.: refunded -> succeeded
  }
  charge.status = to;
  return [{ type: `billing.charge_${to}`, chargeId: charge.id,
            originType: charge.originType, originId: charge.originId }];
}
```

O pedido tem sua própria máquina: `awaiting_payment → paid | expired | cancelled`, e `paid → refunded`. Leia sempre a linha com `SELECT ... FOR UPDATE` antes de transicionar, para que o job de expiração e o webhook nunca decidam ao mesmo tempo.

### 5. Confirmação do pedido por evento

O módulo de vendas consome `billing.charge_succeeded` filtrando `originType = 'order'`.

```ts
// sales/application/on-charge-succeeded.ts
export async function onChargeSucceeded(evt, tx) {
  const order = await orders.lockById(tx, evt.originId);

  if (order.status === 'paid') return;                // já processado

  if (order.status === 'awaiting_payment') {
    await inventory.convertReservationToSale(tx, order);
    await orders.markPaid(tx, order.id);
    await tickets.issueFor(tx, order);                  // códigos aleatórios únicos
    await outbox.add(tx, 'sales.order_paid', { orderId: order.id }); // dispara e-mail
    return;
  }

  if (order.status === 'expired') {                     // PAGAMENTO TARDIO
    const reserved = await inventory.tryReserveAgain(tx, order);
    if (reserved) return confirmLate(tx, order);        // ainda tinha estoque: entrega
    await billing.requestRefund(tx, {                   // esgotou: estorna
      chargeId: evt.chargeId, reason: 'late_payment',
      idempotencyKey: `refund:late:${evt.chargeId}`,
    });
  }
}
```

**Como a devolução Pix acontece.** O job de expiração não trata o pagamento tardio, porque roda antes dele. Quem trata é o consumidor acima, quando o webhook de pagamento chega. A sequência é:

1. `billing.requestRefund` grava o estorno em `refunds` como `pending` e enfileira a chamada ao provedor.
2. O adaptador pede uma devolução Pix. O dinheiro volta para a conta de origem do pagador, normalmente em segundos.
3. A confirmação chega por outro webhook, e o estorno vira `succeeded`.
4. O comprador recebe um e-mail explicando que o pagamento chegou após o prazo e foi devolvido.

Se a chamada ao provedor falhar, o job do BullMQ tenta de novo com a mesma chave de idempotência, então não há risco de devolver duas vezes.

### 6. Job de expiração

O job atrasado da fila `order-expiration` (seção 3.1) dispara no `expires_at` de cada pedido. Antes de expirar, ele **consulta o provedor**: se a cobrança já foi paga e só o webhook está atrasado, o pedido é confirmado em vez de expirado. Isso evita a maior parte dos estornos desnecessários.

```ts
// sales/application/expire-order.ts
export async function expireOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const order = await orders.lockById(tx, orderId);   // SELECT ... FOR UPDATE
    if (order.status !== 'awaiting_payment') return;   // já pago ou expirado

    const charge = await billing.findPendingCharge(order.id);
    if (charge) {
      const { status } = await billing.refreshFromProvider(charge.id); // getCharge
      if (status === 'succeeded') return;  // o fluxo de confirmação cuida do pedido
      await billing.cancelCharge(charge.id); // invalida o QR code no provedor
    }

    await inventory.releaseReservation(tx, order);
    await orders.markExpired(tx, order.id);
  });
}
```

A varredura da fila `maintenance` cobre jobs perdidos e também procura cobranças `succeeded` cuja origem está `expired` ou `cancelled` e que não têm estorno. Esse é o último nível de proteção: pega qualquer pagamento tardio cujo evento tenha se perdido no caminho.

### 7. Estornos e chargeback

**Desistência do comprador.** Para compras online, o Código de Defesa do Consumidor (art. 49) prevê arrependimento em 7 dias. Defina com cuidado a política para datas próximas ao evento e valide com alguém da área jurídica. No código, é um comando `cancelOrder` que cancela os ingressos e chama `billing.requestRefund`.

**Cancelamento do evento.** Um job percorre os pedidos pagos em lotes e pede um estorno por pedido, com chave `refund:event_cancelled:<orderId>`. Se o job cair no meio, basta rodar de novo: a chave impede estorno duplo.

**Chargeback.** O webhook de disputa cria um registro em `disputes` e emite `billing.dispute_opened`. Vendas cancela os ingressos ainda não usados. Se o ingresso já foi usado, o registro de check-in (`used_at`) vira evidência para contestar a disputa.

## Fase 2 — Planos de membro e benefícios

A Fase 2 adiciona dois módulos (Assinaturas e Benefícios) e toca o código da Fase 1 em apenas dois pontos: o cálculo de preço e a verificação de elegibilidade de compra. A cobrança é a mesma; só muda a origem, que passa a ser `invoice`.

### Ciclo da assinatura

1. O usuário escolhe um plano e cadastra um meio de pagamento. O provedor devolve um token, guardado em `payment_method_ref`.
2. Assinaturas cria a assinatura como `incomplete` e a primeira fatura, e chama `billing.createCharge({ originType: 'invoice', originId })`.
3. Cobrança emite `billing.charge_succeeded` com `originType = 'invoice'`. Assinaturas marca a fatura como paga, ativa a assinatura e emite `subscriptions.period_paid`.
4. Benefícios consome esse evento e cria os `entitlement_grants` válidos até `current_period_end` mais um período de carência (por exemplo, 3 dias).
5. Um job diário gera a fatura do próximo período alguns dias antes do vencimento. O `UNIQUE (subscription_id, period_start)` impede fatura duplicada se o job rodar duas vezes.

### Retentativas (dunning)

Quando a cobrança falha, a fatura continua `open` e ganha `next_attempt_at`. Um calendário típico é tentar de novo em 1, 3 e 5 dias, avisando o usuário por e-mail a cada falha. Depois da última, a assinatura vira `cancelled` e os grants não são renovados, então o benefício some sozinho ao fim da carência.

Para Pix Automático, o fluxo é o mesmo; o que muda é o adaptador de gateway e o fato de a autorização ser dada uma vez pelo pagador no app do banco.

**Motor próprio ou assinatura do provedor?** Stripe Billing e as assinaturas do Mercado Pago fazem renovação e retentativa por você. Para estudo, o motor próprio ensina muito mais. Em produção, muitas empresas usam o do provedor. A arquitetura acima suporta os dois: com o provedor, o adaptador só traduz os webhooks dele para `subscriptions.period_paid`.

### Benefícios como handlers registrados

Cada tipo de benefício é uma classe que implementa a mesma interface. Vendas não conhece os tipos; pergunta ao registro.

```ts
// entitlements/domain/benefit-handler.ts
export interface BenefitHandler {
  type: BenefitType;
  // ajusta o preço; retorna ajustes a gravar em order_adjustments
  adjustPrice?(ctx: PricingContext, grant: Grant): Adjustment[];
  // libera ou bloqueia a compra (ex.: pré-venda)
  canPurchase?(ctx: PurchaseContext, grant: Grant): boolean;
}

export class TicketDiscountHandler implements BenefitHandler {
  type = 'ticket_discount' as const;
  adjustPrice(ctx, grant) {
    const { percent } = grant.config;
    return ctx.items.map((i) => ({
      type: 'member_discount',
      amountCents: Math.floor((i.unitPriceCents * i.quantity * percent) / 100),
      sourceType: 'entitlement_grant', sourceId: grant.id,
    }));
  }
}

export class PresaleAccessHandler implements BenefitHandler {
  type = 'presale_access' as const;
  canPurchase(ctx, grant) {
    return ctx.now >= ctx.ticketType.presaleStartAt;
  }
}
```

### Os dois pontos onde vendas é tocada

**Cálculo de preço vira um pipeline.** Na Fase 1, `pricing.calculate` só somava os itens. Agora ele percorre regras em sequência: preço base, depois benefícios, depois (no futuro) cupons. Cada regra devolve ajustes, e o pedido guarda tudo em `order_adjustments`.

```ts
// sales/domain/pricing.ts
const rules: PriceRule[] = [basePriceRule, entitlementRule /* , couponRule */];

export async function calculate(ctx) {
  let adjustments: Adjustment[] = [];
  for (const rule of rules) adjustments = adjustments.concat(await rule.apply(ctx));
  return summarize(ctx.items, adjustments); // subtotal, desconto, total
}
```

**Janela de venda vira uma política.** A checagem `now() BETWEEN sales_start_at AND sales_end_at` sai do SQL e vira `PurchasePolicy.canPurchase(ctx)`, que considera a venda geral e os handlers com `canPurchase`. A janela de pré-venda pede um campo novo, `presale_start_at`, em `ticket_types`.

**Ingressos inclusos no plano** reaproveitam o padrão da Fase 1: a cota é consumida com um `INSERT` em `benefit_usages` dentro da transação do pedido, e uma checagem de soma impede usar mais do que o plano dá. É o mesmo problema de concorrência do estoque, em outra tabela.

## Fase 3 — Planos para organizadores

A Fase 3 quase não exige código novo: um plano de organizador é um registro em `plans` com `audience = 'organizer'`, e a taxa da plataforma é só mais um benefício (`platform_fee`). Se essa fase exigir mudanças grandes, é sinal de que a Fase 2 ficou acoplada demais.

**Taxa resolvida por benefício.** Um handler `PlatformFeeHandler` lê o grant ativo do organizador. Sem plano, vale a taxa padrão da plataforma.

```ts
// sales/domain/fee-policy.ts
export async function resolvePlatformFee(organizerId: string, totalCents: number) {
  const grant = await entitlements.findActive(organizerId, 'platform_fee');
  const { percent, fixedCents } = grant?.config ?? DEFAULT_FEE; // ex.: 8% + R$ 1,00
  return Math.round((totalCents * percent) / 100) + fixedCents;
}
```

**Snapshot no pedido.** A taxa é calculada na criação do pedido e gravada em `orders.platform_fee_cents`. Se o organizador trocar de plano amanhã, os pedidos antigos não mudam. O mesmo vale para `unit_price_cents`: tudo que entra em cálculo de dinheiro é congelado no momento da compra.

**Limites de plano** (número de eventos ativos, relatórios avançados, página personalizada) são grants do tipo `feature`. Cada funcionalidade consulta `entitlements.has(organizerId, 'feature', 'advanced_reports')`, e nenhum código verifica "o plano se chama Pro".

**Upgrade e downgrade.** No upgrade, cobre a diferença proporcional aos dias restantes e libere os novos grants na hora. No downgrade, agende a troca para o fim do período (`cancel_at_period_end` mais um `scheduled_plan_id`), o que evita calcular crédito.

## Fase 4 — Split de pagamento

No split, o provedor divide cada cobrança entre o organizador e a plataforma no momento do pagamento. O sistema passa a precisar de um ledger em partidas dobradas, porque agora o dinheiro tem mais de um dono e estornos precisam desfazer cada parte corretamente.

**Onboarding do recebedor.** O organizador cria sua conta de recebedor no provedor (Stripe Connect, Mercado Pago ou Pagar.me), que faz a verificação de identidade (KYC). Guarde o resultado em `recipients`. Eventos de organizadores sem recebedor `active` não podem abrir vendas.

**Regras de split calculadas a partir do snapshot.** Na criação da cobrança, o módulo de cobrança recebe as partes já calculadas por vendas:

```ts
billing.createCharge({
  originType: 'order', originId: order.id, amountCents: order.totalCents,
  splits: [
    { role: 'organizer', recipientId, amountCents: order.totalCents - order.platformFeeCents },
    { role: 'platform', amountCents: order.platformFeeCents },
  ],
  // ...
});
```

Uma decisão de negócio a tomar aqui: quem paga a taxa do gateway, o organizador ou a plataforma. Deixe isso explícito em configuração, não escondido em uma subtração.

**Ledger.** Cada fato financeiro gera uma `ledger_transaction` com lançamentos que somam zero. Uma venda de R$ 100,00 com taxa de plataforma de R$ 9,00 e taxa de gateway de R$ 4,00 paga pela plataforma fica assim:

| Conta | Débito (R$) | Crédito (R$) |
| --- | --- | --- |
| `gateway_receivable` | 96,00 |  |
| `gateway_fees` | 4,00 |  |
| `organizer_payable:<id>` |  | 91,00 |
| `platform_revenue` |  | 9,00 |

O estorno é outra transação com os lançamentos invertidos; nunca se apaga nem se edita uma linha do ledger.

**Estorno e chargeback com split.** Defina quem absorve o prejuízo de um chargeback (normalmente o organizador, até o limite do saldo a receber). O provedor costuma permitir reverter a transferência ao recebedor junto com o estorno.

**Conciliação diária.** Um job baixa o relatório de liquidação do provedor e compara, linha a linha, com o ledger. Toda divergência vira um alerta e um registro para análise. É esse job que dá confiança de que o sistema está certo.

## Mapa de convergência

As quatro fases se encontram em seis pontos do código. Se esses pontos forem desenhados como extensíveis na Fase 1, cada fase seguinte adiciona uma implementação sem editar as anteriores.

| Ponto de convergência | Onde fica | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
| --- | --- | --- | --- | --- | --- |
| Criação de cobrança | `billing.createCharge` | Origem `order` | Origem `invoice` | Origem `invoice` (organizador) | Recebe `splits` |
| Roteamento por origem | Consumidores de `billing.charge_*` | Vendas confirma pedido | Assinaturas paga fatura | Mesmo consumidor da Fase 2 | Contabilidade grava no ledger |
| Cálculo de preço | `sales/domain/pricing.ts` | Regra de preço base | Regra de benefícios | Sem mudança | Sem mudança |
| Elegibilidade de compra | `PurchasePolicy` | Janela de venda geral | Pré-venda por benefício | Limites de plano (`feature`) | Recebedor `active` obrigatório |
| Benefícios | Registro de `BenefitHandler` | Não existe ainda | Desconto, pré-venda, cota | Taxa, funcionalidades | Sem mudança |
| Estorno | `billing.requestRefund` | Desistência, evento cancelado, pagamento tardio | Estorno de fatura | Proporcional no upgrade | Reversão de split e ledger |

Repare na coluna da Fase 3: quase tudo é "mesmo da Fase 2" ou "sem mudança". É o resultado esperado quando os pontos de convergência estão certos.

**O ponto mais importante é o roteamento por origem.** O módulo de cobrança emite eventos genéricos com `originType` e `originId`, e nunca chama vendas ou assinaturas diretamente. Cada módulo interessado assina o evento e ignora as origens que não são dele. Uma nova forma de vender (uma doação, uma loja de produtos do evento) é apenas um novo `originType` com seu próprio consumidor.

## Princípios de extensibilidade

Uma funcionalidade nova deve entrar adicionando código, não editando o que já funciona. Os seis princípios abaixo são o que torna isso possível neste projeto.

1. **Registros em vez de `if`/`switch`.** Gateways, benefícios, regras de preço e consumidores de origem são listas de implementações de uma interface. Um `switch (benefitType)` espalhado pelo código é o sinal de que algo deveria ser um registro.
2. **Eventos via outbox entre módulos.** Quem emite não sabe quem escuta. O evento é gravado na mesma transação da mudança de estado e publicado depois, então nunca existe pedido pago sem evento.
3. **Consumidores idempotentes.** Todo consumidor grava `(consumer, message_id)` em `processed_messages` na mesma transação do seu efeito. Reentregar uma mensagem nunca causa efeito duplo.
4. **Snapshot de tudo que vira dinheiro.** Preço unitário, descontos e taxa são gravados no pedido. Regras podem mudar; o passado não.
5. **Perguntar pela capacidade, nunca pelo nome do plano.** `has('presale_access')`, e não `plan.name === 'Ouro'`. Planos mudam de nome; capacidades permanecem.
6. **Módulo dono dos próprios dados.** Cada módulo expõe uma fachada (`billing/index.ts`) e é proibido importar de `billing/infra` ou ler as tabelas dele. Ferramentas como `dependency-cruiser` ou `eslint-plugin-boundaries` validam isso no CI.

### Estrutura de pastas por módulo

```text
src/
  modules/
    sales/
      domain/         # entidades, máquina de estados, pricing, policies (sem I/O)
      application/    # casos de uso: createOrder, cancelOrder, onChargeSucceeded
      infra/          # repositórios SQL, controllers HTTP, jobs
      index.ts        # fachada pública: o único arquivo que outros módulos importam
    billing/
      domain/         # Charge, Refund, gateway-port.ts
      application/
      infra/
        gateways/     # stripe.ts, mercadopago.ts, fake.ts
      index.ts
    subscriptions/    # Fase 2
    entitlements/     # Fase 2
    accounting/       # Fase 4: ledger e conciliação
  shared/
    outbox/  events/  money/  db/
```

### Checklist para adicionar uma funcionalidade

- [ ] Ela é uma nova **origem** de cobrança, um novo **benefício**, uma nova **regra de preço** ou um novo **gateway**? Se for, implemente a interface e registre.
- [ ] As tabelas novas ficam dentro do módulo dono, sem chave estrangeira para outro módulo.
- [ ] Os eventos que ela emite ou consome estão nomeados (`modulo.fato_no_passado`) e documentados.
- [ ] Todo efeito externo tem chave de idempotência derivada do domínio.
- [ ] Valores monetários são congelados no momento da compra.
- [ ] A migração é retrocompatível: colunas novas são opcionais ou têm valor padrão.
- [ ] Existe teste para evento duplicado e fora de ordem.
- [ ] A funcionalidade pode ser ligada por feature flag.

## Testes e observabilidade

Em pagamentos, os testes que mais importam são os de casos de borda e concorrência, não o caminho feliz. Um `FakeGateway` em memória, implementando a mesma porta, permite simular qualquer resposta do provedor sem rede.

| Teste | O que prova | Fase |
| --- | --- | --- |
| 100 compras simultâneas para 10 ingressos | Exatamente 10 pedidos criados, 90 recusados | 1 |
| Mesmo webhook entregue 3 vezes | Um único pedido pago e um único conjunto de ingressos | 1 |
| `charge_succeeded` chegando antes de `charge_authorized` | Estado final correto, sem erro de transição | 1 |
| Pagamento Pix após a expiração, com estoque esgotado | Estorno automático com reason `late_payment` | 1 |
| Job de cancelamento do evento interrompido e reexecutado | Nenhum estorno duplicado | 1 |
| Renovação falha três vezes | Assinatura cancelada e benefício removido após a carência | 2 |
| Desconto de membro mais cota de ingresso incluso | Valores corretos em `order_adjustments` | 2 |
| Troca de plano do organizador | Pedidos antigos mantêm a taxa original | 3 |
| Estorno parcial com split | Ledger soma zero e reverte a parte certa de cada recebedor | 4 |

Além disso, rode testes de contrato contra o sandbox do provedor real (Stripe CLI ou ambiente de teste do Mercado Pago) em uma pipeline separada, já que dependem de rede.

Para a fila, inclua um teste de resiliência: apague os dados do Redis (`FLUSHALL` em ambiente de teste) com webhooks e pedidos pendentes, rode a varredura e verifique que tudo foi reprocessado sem nenhum efeito duplicado. Esse teste prova que o Redis é mesmo descartável.

**Observabilidade.** Propague um ID de correlação do pedido até a cobrança, o webhook e o e-mail, para seguir uma compra inteira nos logs. As métricas mínimas são:

- taxa de aprovação de cartão;
- conversão de pedido criado para pago;
- atraso entre o pagamento e o processamento do webhook;
- pedidos expirados e pagamentos tardios estornados;
- webhooks com falha após o número máximo de tentativas;
- divergências da conciliação (Fase 4).

Crie alertas para webhooks acumulados sem processar e para qualquer divergência na conciliação. São os dois sintomas que mais cedo indicam dinheiro sendo perdido.
