import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { WebhookIngestionService } from '../../application/webhook-ingestion.service.js';
import { BillingRepository } from '../billing.repository.js';
import { FakeGateway } from '../gateways/fake.gateway.js';
import { NotFoundError } from '../../../common/errors/types/NotFoundError.js';

class CloseDisputeDto {
  @ApiProperty({ enum: ['won', 'lost'] })
  @IsIn(['won', 'lost'])
  status: 'won' | 'lost';
}

// Faz o papel do pagador e do banco no provedor fake: cada ação muda o estado no fake
// e entrega o webhook assinado, pelo mesmo caminho de um webhook real
@ApiTags('Fake gateway')
@Controller('/fake-gateway')
export class FakeGatewayController {
  constructor(
    private readonly fake: FakeGateway,
    private readonly repository: BillingRepository,
    private readonly ingestion: WebhookIngestionService,
  ) {}

  @Post('/charges/:chargeId/pay')
  @HttpCode(200)
  async payPix(@Param('chargeId', ParseUUIDPipe) chargeId: string) {
    const providerChargeId = await this.findProviderChargeId(chargeId);

    return this.deliver(this.fake.simulatePixPayment(providerChargeId));
  }

  @Post('/charges/:chargeId/dispute')
  @HttpCode(200)
  async openDispute(@Param('chargeId', ParseUUIDPipe) chargeId: string) {
    const providerChargeId = await this.findProviderChargeId(chargeId);

    return this.deliver(this.fake.openDispute(providerChargeId));
  }

  @Post('/disputes/:disputeId/close')
  @HttpCode(200)
  async closeDispute(
    @Param('disputeId', ParseUUIDPipe) disputeId: string,
    @Body() { status }: CloseDisputeDto,
  ) {
    this.assertEnabled();

    const dispute = await this.repository.findDispute(disputeId);

    if (!dispute) {
      throw new NotFoundError('Disputa não encontrada.');
    }

    return this.deliver(this.fake.closeDispute(dispute.provider_dispute_id, status));
  }

  private async findProviderChargeId(chargeId: string) {
    this.assertEnabled();

    const charge = await this.repository.findCharge(chargeId);

    if (charge?.provider !== 'fake' || !charge.provider_charge_id) {
      throw new NotFoundError('Cobrança não encontrada no provedor fake.');
    }

    return charge.provider_charge_id;
  }

  private async deliver(webhook: { rawBody: Buffer; headers: Record<string, string> }) {
    const webhookEventId = await this.ingestion.receive(
      'fake',
      webhook.rawBody,
      webhook.headers,
    );

    return { webhookEventId };
  }

  // Só com as duas variáveis explícitas: esquecer uma delas nunca deixa o simulador aberto
  private assertEnabled() {
    if (
      process.env.FAKE_GATEWAY_SIMULATOR !== 'on' ||
      process.env.PAYMENT_PROVIDER !== 'fake'
    ) {
      throw new NotFoundError('Simulador do provedor fake desativado.');
    }
  }
}
