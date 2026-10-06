import { Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from './repositories/payment-methods.repository.js';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async findAll() {
    return this.repository.findAll();
  }
}
