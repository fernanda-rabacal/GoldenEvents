import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PAYMENT_GATEWAYS, type PaymentGateway } from '../../domain/gateway-port.js';
import { NotFoundError } from '../../../common/errors/types/not-found.error.js';

// Um novo provedor é só mais um adaptador na lista de PAYMENT_GATEWAYS
@Injectable()
export class GatewayRegistry implements OnModuleInit {
  constructor(@Inject(PAYMENT_GATEWAYS) private readonly gateways: PaymentGateway[]) {}

  // Falha ao subir em vez de cobrar pelo provedor errado: o fake aprova qualquer cartão
  onModuleInit() {
    const provider = process.env.PAYMENT_PROVIDER;

    if (!this.gateways.some(gateway => gateway.provider === provider)) {
      throw new Error(`PAYMENT_PROVIDER inválido ou ausente: "${provider ?? ''}".`);
    }

    if (provider === 'fake' && process.env.NODE_ENV === 'production') {
      throw new Error('O provedor fake não pode ser usado em produção.');
    }
  }

  get(provider: string) {
    const gateway = this.gateways.find(gateway => gateway.provider === provider);

    if (!gateway) {
      throw new NotFoundError('Provedor de pagamento não encontrado.');
    }

    return gateway;
  }

  // Provedor usado nas cobranças novas; as antigas continuam no provedor em que foram criadas
  active() {
    return this.get(process.env.PAYMENT_PROVIDER);
  }
}
