import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import {
  QueryOrganizerAudienceDto,
  QueryOrganizerAudienceSummaryDto,
  QueryOrganizerOrdersDto,
  QueryOrganizerSummaryDto,
} from './dto/query-organizer-sales.dto.js';
import { OrdersService } from '../../application/orders.service.js';
import { OrganizerSalesService } from '../../application/organizer-sales.service.js';
import { JwtAuthGuard } from '../../../common/auth/jwt.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { Requester } from '../../../common/auth/requester.js';
import { MessageResponse } from '../../../../response/message.response.js';
import { RateLimit } from '../../../../shared/rate-limit/rate-limit.guard.js';

@ApiTags('Order')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly organizerSales: OrganizerSalesService,
  ) {}

  // Reserva os ingressos. Pedido gratuito já sai pago, com os ingressos emitidos
  @Post()
  @RateLimit({
    name: 'orders-create',
    by: 'user',
    limit: 10,
    windowMs: 60_000,
    message: 'Muitas tentativas de compra em pouco tempo.',
  })
  async create(
    @CurrentUser() requester: Requester,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(requester.id, createOrderDto);

    return new MessageResponse(
      order.status === 'paid'
        ? 'Ingresso(s) emitido(s) com sucesso.'
        : 'Pedido criado. Os ingressos ficam reservados até o fim do prazo de pagamento.',
      order,
    );
  }

  @Get()
  async findMine(@CurrentUser() requester: Requester) {
    return this.ordersService.findMine(requester.id);
  }

  // Antes de /:id: senão "organizer" seria lido como o id de um pedido
  @Get('/organizer')
  async findForOrganizer(
    @Query() query: QueryOrganizerOrdersDto,
    @CurrentUser() requester: Requester,
  ) {
    return this.organizerSales.listOrders(requester, query);
  }

  @Get('/organizer/summary')
  async summarizeForOrganizer(
    @Query() query: QueryOrganizerSummaryDto,
    @CurrentUser() requester: Requester,
  ) {
    return this.organizerSales.summarize(requester, query);
  }

  @Get('/organizer/audience')
  async listAudience(
    @Query() query: QueryOrganizerAudienceDto,
    @CurrentUser() requester: Requester,
  ) {
    return this.organizerSales.listAudience(requester, query);
  }

  @Get('/organizer/audience/summary')
  async summarizeAudience(
    @Query() query: QueryOrganizerAudienceSummaryDto,
    @CurrentUser() requester: Requester,
  ) {
    return this.organizerSales.summarizeAudience(requester, query);
  }

  @Get('/:id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: Requester,
  ) {
    return this.ordersService.findOne(requester, id);
  }

  // Cartão responde na hora; Pix devolve o código e é confirmado pelo webhook
  @Post('/:id/pay')
  @RateLimit({
    name: 'orders-pay',
    by: 'user',
    limit: 10,
    windowMs: 60_000,
    message: 'Muitas tentativas de pagamento em pouco tempo.',
  })
  async pay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: Requester,
    @Body() payOrderDto: PayOrderDto,
  ) {
    const charge = await this.ordersService.pay(requester, id, payOrderDto);

    return new MessageResponse(
      charge.status === 'succeeded'
        ? 'Pagamento aprovado. Os ingressos serão emitidos em instantes.'
        : charge.method === 'card'
          ? 'Confirme o pagamento com o seu banco.'
          : 'Pague o Pix para confirmar o pedido.',
      charge,
    );
  }

  @Post('/:id/cancel')
  @HttpCode(200)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: Requester,
  ) {
    const order = await this.ordersService.cancel(requester, id);

    return new MessageResponse(
      order.status === 'refunded'
        ? 'Pedido cancelado. O estorno foi solicitado.'
        : 'Pedido cancelado.',
      order,
    );
  }
}
