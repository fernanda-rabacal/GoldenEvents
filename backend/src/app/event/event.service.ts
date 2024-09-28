import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { EventRepository } from './repositories/events.repository';
import { BuyEventTicketDto } from './dto/buy-ticket.dto';

@Injectable()
export class EventService {
  constructor(private readonly repository: EventRepository) {}

  async create(createEventDto: CreateEventDto) {
    return this.repository.create(createEventDto);
  }

  async findAll(query: QueryEventDto) {
    return this.repository.findAll(query);
  }

  async findById(eventId: number) {
    return this.repository.findById(eventId);
  }

  async findBySlug(slug: string) {
    return this.repository.findBySlug(slug);
  }

  async buyTicket(buyEventTicket: BuyEventTicketDto) {
    return this.repository.buyTicket(buyEventTicket);
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
    return this.repository.update(id, userId, updateEventDto);
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
