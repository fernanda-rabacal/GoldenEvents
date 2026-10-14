import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type ChargeOriginType,
  type PaymentProvider,
  type RefundStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../db/prisma.service.js';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ON CONFLICT DO NOTHING: duas requisições com a mesma chave recebem a mesma cobrança
  async insertChargeIfAbsent(data: Omit<Prisma.ChargeCreateManyInput, 'id'>) {
    await this.prisma.charge.createMany({
      data: [{ ...data, id: randomUUID() }],
      skipDuplicates: true,
    });

    return this.prisma.charge.findUnique({
      where: { idempotency_key: data.idempotency_key },
    });
  }

  async findCharge(id: string) {
    return this.prisma.charge.findUnique({ where: { id } });
  }

  async findChargeByProviderId(provider: PaymentProvider, providerChargeId: string) {
    return this.prisma.charge.findUnique({
      where: {
        provider_provider_charge_id: { provider, provider_charge_id: providerChargeId },
      },
    });
  }

  async findChargesByOrigin(originType: ChargeOriginType, originId: string) {
    return this.prisma.charge.findMany({
      where: { origin_type: originType, origin_id: originId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findPaidChargesWithoutRefund(
    originType: ChargeOriginType,
    originIds: string[],
    updatedBefore: Date,
  ) {
    return this.prisma.charge.findMany({
      where: {
        origin_type: originType,
        origin_id: { in: originIds },
        status: 'succeeded',
        updated_at: { lt: updatedBefore },
        refunds: { none: {} },
      },
    });
  }

  // SELECT ... FOR UPDATE: webhook, expiração e estorno nunca decidem ao mesmo tempo sobre a mesma cobrança
  async lockCharge(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRaw`SELECT id FROM "charge" WHERE id = ${id}::uuid FOR UPDATE`;

    return tx.charge.findUniqueOrThrow({ where: { id } });
  }

  async updateCharge(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.ChargeUpdateInput,
  ) {
    return tx.charge.update({ where: { id }, data });
  }

  async findRefund(tx: Prisma.TransactionClient, id: string) {
    return tx.refund.findUnique({ where: { id } });
  }

  async findRefundByKey(tx: Prisma.TransactionClient, idempotencyKey: string) {
    return tx.refund.findUnique({ where: { idempotency_key: idempotencyKey } });
  }

  async findRefundByProviderId(provider: PaymentProvider, providerRefundId: string) {
    return this.prisma.refund.findFirst({
      where: { provider_refund_id: providerRefundId, charge: { provider } },
    });
  }

  async createRefund(
    tx: Prisma.TransactionClient,
    data: Prisma.RefundUncheckedCreateInput,
  ) {
    return tx.refund.create({ data });
  }

  async updateRefund(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.RefundUpdateInput,
  ) {
    return tx.refund.update({ where: { id }, data });
  }

  async sumRefunds(
    tx: Prisma.TransactionClient,
    chargeId: string,
    statuses: RefundStatus[],
  ) {
    const { _sum } = await tx.refund.aggregate({
      where: { charge_id: chargeId, status: { in: statuses } },
      _sum: { amount_cents: true },
    });

    return _sum.amount_cents ?? 0;
  }

  async findDispute(id: string) {
    return this.prisma.dispute.findUnique({ where: { id } });
  }

  async findDisputeByProviderId(tx: Prisma.TransactionClient, providerDisputeId: string) {
    return tx.dispute.findUnique({ where: { provider_dispute_id: providerDisputeId } });
  }

  async createDispute(
    tx: Prisma.TransactionClient,
    data: Prisma.DisputeUncheckedCreateInput,
  ) {
    return tx.dispute.create({ data });
  }

  async updateDispute(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.DisputeUpdateInput,
  ) {
    return tx.dispute.update({ where: { id }, data });
  }
}
