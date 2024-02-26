import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Post,
  UseGuards,
  Body,
  Req,
  Put,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { Request } from 'express';
import { MessageResponse } from 'src/response/message.response';
import { CategoryService } from './category.service';

@ApiTags('Event')
@Controller('/event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryEventDto) {
    return await this.eventService.findAll(query);
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return this.eventService.findById(+id);
  }

  @Get('/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Get('/categories')
  async findAllCategories() {
    return this.categoryService.findAll();
  }

  @Get('/categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.categoryService.findById(+id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: Request, @Body() createEventDto: CreateEventDto) {
    createEventDto.userId = req.user['id'];

    const event = await this.eventService.create(createEventDto);

    return new MessageResponse('Evento cadastrado com sucesso.', event);
  }

  @Post('/:id/buy-ticket')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async buyTickets() {}

  @Put('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = this.eventService.update(+id, updateEventDto);
    return new MessageResponse('Evento atualizado com sucesso.', event);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.eventService.delete(+id);
  }
}
