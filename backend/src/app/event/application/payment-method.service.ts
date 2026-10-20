import { Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from '../infra/payment-method.repository.js';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async findAll() {
    return this.repository.findAll();
  }
}
