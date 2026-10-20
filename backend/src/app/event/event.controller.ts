import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Post,
  UseGuards,
  Body,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { EventService } from './event.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { QueryMetricsDto } from './dto/query-metrics.dto.js';
import type { Requester } from '../common/auth/requester.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/auth/jwt.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import { MessageResponse } from '../../response/message.response.js';
import { CategoryService } from './category.service.js';
import { PaymentMethodService } from './payment-method.service.js';

@ApiTags('Event')
@Controller('/events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly categoryService: CategoryService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryEventDto) {
    return await this.eventService.findAll(query);
  }

  @Get('/categories')
  async findAllCategories() {
    return this.categoryService.findAll();
  }

  @Get('/categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.categoryService.findById(+id);
  }

  @Get('/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findMine(@Query() query: QueryEventDto, @CurrentUser() requester: Requester) {
    return await this.eventService.findAll(query, requester.id);
  }

  @Get('/me/metrics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyMetrics(
    @Query() query: QueryMetricsDto,
    @CurrentUser() requester: Requester,
  ) {
    return await this.eventService.getOrganizerMetrics(requester, query.days);
  }

  @Get('/payment-methods')
  async findAllPaymentMethods() {
    return this.paymentMethodService.findAll();
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return this.eventService.findById(+id);
  }

  @Get('/:id/lots/sales')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getLotSales(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: Requester,
  ) {
    return this.eventService.getLotSales(requester, id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() requester: Requester,
    @Body() createEventDto: CreateEventDto,
  ) {
    const event = await this.eventService.create(requester, createEventDto);

    return new MessageResponse('Evento cadastrado com sucesso.', event);
  }

  @Patch('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() requester: Requester,
  ) {
    const event = await this.eventService.update(requester, +id, updateEventDto);

    return new MessageResponse('Evento atualizado com sucesso.', event);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: number, @CurrentUser() requester: Requester) {
    return this.eventService.delete(requester, +id);
  }
}
