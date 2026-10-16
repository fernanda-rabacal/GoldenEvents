import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import {
  QueryOrganizerOrdersDto,
  QueryOrganizerSummaryDto,
} from './dto/query-organizer-sales.dto.js';
import { OrdersService } from '../../application/orders.service.js';
import { OrganizerSalesService } from '../../application/organizer-sales.service.js';
import { JwtAuthGuard } from '../../../auth/guard/jwt.guard.js';
import type { Requester } from '../../../user/user.service.js';
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
  async create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(
      (req.user as Requester).id,
      createOrderDto,
    );

    return new MessageResponse(
      order.status === 'paid'
        ? 'Ingresso(s) emitido(s) com sucesso.'
        : 'Pedido criado. Os ingressos ficam reservados até o fim do prazo de pagamento.',
      order,
    );
  }

  @Get()
  async findMine(@Req() req: Request) {
    return this.ordersService.findMine((req.user as Requester).id);
  }

  // Antes de /:id: senão "organizer" seria lido como o id de um pedido
  @Get('/organizer')
  async findForOrganizer(@Query() query: QueryOrganizerOrdersDto, @Req() req: Request) {
    return this.organizerSales.listOrders(req.user as Requester, query);
  }

  @Get('/organizer/summary')
  async summarizeForOrganizer(
    @Query() query: QueryOrganizerSummaryDto,
    @Req() req: Request,
  ) {
    return this.organizerSales.summarize(req.user as Requester, query);
  }

  @Get('/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.ordersService.findOne(req.user as Requester, id);
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
    @Req() req: Request,
    @Body() payOrderDto: PayOrderDto,
  ) {
    const charge = await this.ordersService.pay(req.user as Requester, id, payOrderDto);

    return new MessageResponse(
      charge.status === 'succeeded'
        ? 'Pagamento aprovado. Os ingressos serão emitidos em instantes.'
        : 'Pague o Pix para confirmar o pedido.',
      charge,
    );
  }

  @Post('/:id/cancel')
  @HttpCode(200)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const order = await this.ordersService.cancel(req.user as Requester, id);

    return new MessageResponse(
      order.status === 'refunded'
        ? 'Pedido cancelado. O estorno foi solicitado.'
        : 'Pedido cancelado.',
      order,
    );
  }
}
