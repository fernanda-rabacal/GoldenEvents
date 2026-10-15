import {
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookIngestionService } from '../../application/webhook-ingestion.service.js';

@ApiTags('Webhooks')
@Controller('/webhooks')
export class WebhookController {
  constructor(private readonly ingestion: WebhookIngestionService) {}

  // Responde em milissegundos; o worker da fila webhooks faz o resto
  @Post('/:provider')
  @HttpCode(200)
  async receive(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.ingestion.receive(provider, req.rawBody, req.headers);

    return { received: true };
  }
}
