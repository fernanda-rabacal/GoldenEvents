import { Injectable } from '@nestjs/common';
import type { Order, OrderItem, OrderStatus, Prisma, RefundReason } from '@prisma/client';
import { ORDER_TRANSITIONS, SALES_EVENTS } from '../domain/order-state.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { BillingService, type ChargeEventPayload } from '../../billing/index.js';
import { TicketInventoryService } from '../../event/ticket-inventory.service.js';
import { BusinessRuleError } from '../../common/errors/types/BusinessRuleError.js';
import { PrismaService } from '../../../db/prisma.service.js';
import { OutboxService } from '../../../shared/outbox/outbox.service.js';
import { checkTransition } from '../../../shared/state-machine.js';

export const ORDER_TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 };

type LockedOrder = Order & { items: OrderItem[] };

function toLotQuantities(items: OrderItem[]) {
  return items.map(({ lot_id, quantity }) => ({ lotId: lot_id, quantity }));
}

// Mudanças de estado do pedido. Toda transição trava a linha do pedido e grava o evento no outbox
@Injectable()
export class OrderLifecycle {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: OrdersRepository,
    private readonly inventory: TicketInventoryService,
    private readonly billing: BillingService,
    private readonly outbox: OutboxService,
  ) {}

  async issue(tx: Prisma.TransactionClient, order: LockedOrder) {
    await this.repository.issueTickets(tx, order);
    await this.outbox.add(tx, SALES_EVENTS.paid, {
      orderId: order.id,
      buyerId: order.buyer_id,
      late: order.status === 'expired',
    });
  }

  // Consumidor de billing.charge_succeeded (roda na transação dele, junto com processed_messages)
  async confirmPayment(tx: Prisma.TransactionClient, payment: ChargeEventPayload) {
    const order = await this.repository.lock(tx, payment.originId);

    if (order.status === 'awaiting_payment') {
      const event = await this.inventory.findEvent(order.event_id);

      if (event?.active) {
        return this.markPaid(tx, order, payment.chargeId);
      }

      // O evento foi cancelado enquanto o pagamento estava a caminho
      await this.inventory.release(tx, order.event_id, toLotQuantities(order.items));
      await this.transition(tx, order, 'cancelled');

      return this.refundCharge(tx, payment.chargeId, 'event_cancelled');
    }

    if (order.status === 'paid') {
      // Duas cobranças pagas para o mesmo pedido (ex.: trocou de Pix para cartão e pagou os dois)
      if (order.paid_charge_id !== payment.chargeId) {
        await this.refundCharge(tx, payment.chargeId, 'duplicate');
      }

      return;
    }

    if (order.status === 'expired' && (await this.reserveAgain(tx, order))) {
      return this.markPaid(tx, order, payment.chargeId);
    }

    // Pagamento tardio sem estoque, ou pedido que já foi encerrado: devolve o dinheiro
    await this.refundCharge(tx, payment.chargeId, 'late_payment');
  }

  // Fecha um pedido não pago (expiração ou cancelamento). false quando não fechou:
  // o pagamento já chegou ou o pedido mudou de estado
  async closeUnpaid(orderId: string, to: Extract<OrderStatus, 'expired' | 'cancelled'>) {
    const { paid } = await this.billing.cancelOpenCharges('order', orderId);

    // A cobrança foi paga e só o evento está atrasado: a confirmação cuida do pedido
    if (paid) {
      return false;
    }

    return this.prisma.$transaction(async tx => {
      const order = await this.repository.lock(tx, orderId);

      if (order.status !== 'awaiting_payment') {
        return false;
      }

      await this.inventory.release(tx, order.event_id, toLotQuantities(order.items));
      await this.transition(tx, order, to);

      return true;
    }, ORDER_TX_OPTIONS);
  }

  // Cancela os ingressos e pede o estorno. A chave refund:<motivo>:<pedido> faz com que
  // reexecutar (ex.: o job de cancelamento do evento caiu no meio) nunca estorne duas vezes
  async refundPaid(
    orderId: string,
    reason: RefundReason,
    options: { releaseStock: boolean; requireUnusedTickets?: boolean },
  ) {
    return this.prisma.$transaction(async tx => {
      const order = await this.repository.lock(tx, orderId);

      if (order.status !== 'paid') {
        return false;
      }

      if (
        options.requireUnusedTickets &&
        (await this.repository.countUsedTickets(tx, order.id)) > 0
      ) {
        throw new BusinessRuleError(
          'Pedidos com ingressos já utilizados não podem ser cancelados.',
        );
      }

      await this.repository.cancelValidTickets(tx, order.id);

      if (options.releaseStock) {
        await this.inventory.release(tx, order.event_id, toLotQuantities(order.items));
      }

      await this.transition(tx, order, 'refunded');

      if (order.paid_charge_id) {
        await this.billing.requestRefund(tx, {
          chargeId: order.paid_charge_id,
          reason,
          idempotencyKey: `refund:${reason}:${order.id}`,
        });
      }

      return true;
    }, ORDER_TX_OPTIONS);
  }

  // Chargeback: os ingressos ainda não usados deixam de valer. Um ingresso usado
  // (used_at) é a evidência para contestar a disputa
  async cancelTicketsForDispute(
    tx: Prisma.TransactionClient,
    dispute: ChargeEventPayload,
  ) {
    const order = await this.repository.lock(tx, dispute.originId);

    if (order.paid_charge_id === dispute.chargeId) {
      await this.repository.cancelValidTickets(tx, order.id);
    }
  }

  private async markPaid(
    tx: Prisma.TransactionClient,
    order: LockedOrder,
    chargeId: string,
  ) {
    checkTransition('pedido', ORDER_TRANSITIONS, order.status, 'paid');

    await this.repository.update(tx, order.id, {
      status: 'paid',
      paid_at: new Date(),
      paid_charge_id: chargeId,
    });
    await this.issue(tx, order);
  }

  private async reserveAgain(tx: Prisma.TransactionClient, order: LockedOrder) {
    const event = await this.inventory.findEvent(order.event_id);

    if (!event?.active || event.start_date <= new Date()) {
      return false;
    }

    return this.inventory.reserve(tx, order.event_id, toLotQuantities(order.items));
  }

  private async refundCharge(
    tx: Prisma.TransactionClient,
    chargeId: string,
    reason: RefundReason,
  ) {
    await this.billing.requestRefund(tx, {
      chargeId,
      reason,
      idempotencyKey: `refund:${reason}:${chargeId}`,
    });
  }

  private async transition(
    tx: Prisma.TransactionClient,
    order: LockedOrder,
    to: Exclude<OrderStatus, 'awaiting_payment' | 'paid'>,
  ) {
    checkTransition('pedido', ORDER_TRANSITIONS, order.status, to);

    await this.repository.update(tx, order.id, { status: to });
    await this.outbox.add(tx, SALES_EVENTS[to], {
      orderId: order.id,
      buyerId: order.buyer_id,
    });
  }
}
