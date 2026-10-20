import { Injectable } from '@nestjs/common';
import { UserTypeEnum } from '@golden-events/shared';
import {
  calculatePrice,
  checkBuyerCancellation,
  checkPurchase,
  checkRequestedItems,
  checkTicketsPerBuyer,
  MIN_TIME_TO_PAY_MS,
  NOT_ENOUGH_TICKETS,
  OPEN_ORDER_EXISTS,
  PIX_EXPIRY_MARGIN_MS,
  RESERVATION_MINUTES,
} from '../domain/purchase-policy.js';
import { CreateOrderDto } from '../infra/http/dto/create-order.dto.js';
import { PayOrderDto } from '../infra/http/dto/pay-order.dto.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { OrderExpirationService } from './order-expiration.service.js';
import { OrderLifecycle, ORDER_TX_OPTIONS } from './order-lifecycle.service.js';
import { BillingService } from '../../billing/index.js';
import { TicketInventoryService } from '../../event/index.js';
import { BusinessRuleError } from '../../common/errors/types/BusinessRuleError.js';
import { ConflictError } from '../../common/errors/types/ConflictError.js';
import { ForbiddenError } from '../../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../../common/errors/types/NotFoundError.js';
import type { Requester } from '../../common/auth/requester.js';
import { PrismaService } from '../../../db/prisma.service.js';

const STATUS_CHANGED = 'O status do pedido acabou de mudar. Atualize a página.';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: OrdersRepository,
    private readonly inventory: TicketInventoryService,
    private readonly billing: BillingService,
    private readonly lifecycle: OrderLifecycle,
    private readonly expiration: OrderExpirationService,
  ) {}

  async create(buyerId: number, { items: requested }: CreateOrderDto) {
    checkRequestedItems(requested);

    const event = await this.inventory.findEventByLotIds(
      requested.map(({ lotId }) => lotId),
    );

    if (!event) {
      throw new NotFoundError('Lote não encontrado.');
    }

    const now = new Date();
    const items = checkPurchase(event, requested, now);
    const price = calculatePrice(items);
    // Pedido gratuito não passa pela cobrança: nasce pago, com os ingressos emitidos
    const isFree = price.totalCents === 0;

    const order = await this.prisma.$transaction(async tx => {
      if (!(await this.inventory.reserve(tx, event.id, items))) {
        throw new BusinessRuleError(NOT_ENOUGH_TICKETS);
      }

      // Depois da reserva, que trava o evento: dois pedidos simultâneos do mesmo comprador
      // não passam juntos pelas verificações
      if (!isFree && (await this.repository.hasOpenOrder(tx, buyerId, event.id, now))) {
        throw new BusinessRuleError(OPEN_ORDER_EXISTS);
      }

      checkTicketsPerBuyer(
        await this.repository.countTicketsHeld(tx, buyerId, event.id, now),
        items,
      );

      const order = await this.repository.create(tx, {
        ...price,
        buyerId,
        eventId: event.id,
        items,
        status: isFree ? 'paid' : 'awaiting_payment',
        paidAt: isFree ? now : null,
        expiresAt: new Date(now.getTime() + RESERVATION_MINUTES * 60_000),
      });

      if (isFree) {
        await this.lifecycle.issue(tx, order);
      }

      return order;
    }, ORDER_TX_OPTIONS);

    if (!isFree) {
      await this.expiration.schedule(order);
    }

    return this.repository.findById(order.id);
  }

  async findMine(buyerId: number) {
    return this.repository.findByBuyer(buyerId);
  }

  async findOne(requester: Requester, orderId: string) {
    const order = await this.findOrder(requester, orderId, true);

    return { ...order, charges: await this.billing.listCharges('order', order.id) };
  }

  async pay(
    requester: Requester,
    orderId: string,
    { method, paymentToken }: PayOrderDto,
  ) {
    const order = await this.findOrder(requester, orderId);

    if (order.status === 'paid') {
      throw new ConflictError('Este pedido já foi pago.');
    }

    if (order.status !== 'awaiting_payment') {
      throw new BusinessRuleError('Este pedido não aceita mais pagamentos.');
    }

    if (order.expires_at.getTime() - Date.now() < MIN_TIME_TO_PAY_MS[method]) {
      throw new BusinessRuleError(
        'O prazo para pagar este pedido está acabando. Faça um novo pedido.',
      );
    }

    const charge = await this.billing.createCharge({
      originType: 'order',
      originId: order.id,
      customerId: order.buyer_id,
      amountCents: order.total_cents,
      currency: order.currency,
      method,
      paymentToken,
      expiresAt:
        method === 'pix'
          ? new Date(order.expires_at.getTime() - PIX_EXPIRY_MARGIN_MS)
          : undefined,
    });

    if (charge.status === 'failed') {
      throw new BusinessRuleError(
        'Pagamento recusado pelo emissor do cartão. Tente outro cartão.',
      );
    }

    return charge;
  }

  async cancel(requester: Requester, orderId: string) {
    const order = await this.findOrder(requester, orderId);

    if (order.status === 'awaiting_payment') {
      if (!(await this.lifecycle.closeUnpaid(order.id, 'cancelled'))) {
        throw new ConflictError(STATUS_CHANGED);
      }
    } else if (order.status === 'paid') {
      checkBuyerCancellation(order, await this.inventory.findEvent(order.event_id));

      const refunded = await this.lifecycle.refundPaid(order.id, 'buyer_request', {
        releaseStock: true,
        requireUnusedTickets: true,
      });

      if (!refunded) {
        throw new ConflictError(STATUS_CHANGED);
      }
    } else {
      throw new BusinessRuleError('Este pedido não pode mais ser cancelado.');
    }

    return this.repository.findById(order.id);
  }

  // Ler: o comprador ou um administrador. Pagar e cancelar: só o comprador
  private async findOrder(requester: Requester, orderId: string, adminCanRead = false) {
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Pedido não encontrado.');
    }

    const isAdmin = requester.user_type_id === UserTypeEnum.ADMIN;

    if (order.buyer_id !== requester.id && !(adminCanRead && isAdmin)) {
      throw new ForbiddenError('Você só pode acessar os seus próprios pedidos.');
    }

    return order;
  }
}
