import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.paymentMethod.findMany({ orderBy: { id: 'asc' } });
  }
}
