import { CategoryRepository } from './repositories/categories.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { EventService } from './event.service';
import { EventRepository } from './repositories/events.repository';
import { PrismaService } from '../../db/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { NotFoundError } from '../common/errors/types/NotFoundError';
import { NotAcceptableException } from '@nestjs/common';
import { BuyEventTicketDto } from './dto/buy-ticket.dto';
import { CategoryService } from './category.service';

describe('EventService', () => {
  let service: EventService;
  let categoryService: CategoryService;
  let prisma: DeepMockProxy<PrismaClient>;
  let expectedOutputEvent: any;
  let expectedOutputCategory: any;
  let updateEventData: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService, CategoryService, EventRepository, CategoryRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<EventService>(EventService);
    categoryService = module.get<CategoryService>(CategoryService);
    prisma = module.get(PrismaService);

    const currentDate = new Date();
    const newStartDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

    expectedOutputCategory = { id: 1, name: 'teste', photo: 'klsmskl' };

    expectedOutputEvent = {
      id: 1,
      slug: 'teste-evento',
      active: true,
      created_at: new Date(),
      update_at: new Date(),
      photo: null,
      name: 'Teste evento',
      description: 'teste unitário',
      start_date: new Date(),
      end_date: null,
      user_id: 1,
      category_id: 1,
      capacity: 300,
      quantity_left: 300,
      location: 'Rua do limoeiro, 12',
      price: 10,
    };

    updateEventData = {
      name: 'Teste evento 1',
      description: 'teste unitário 1',
      startDateTime: String(newStartDate),
      categoryId: 1,
      capacity: 400,
      location: 'Rua do limoeiro, 22',
      price: 10,
    };

    prisma.eventCategory.findFirst.mockResolvedValueOnce(expectedOutputCategory);
    prisma.eventCategory.findMany.mockResolvedValueOnce([expectedOutputCategory]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an event', async () => {
    const newEvent: CreateEventDto = {
      name: 'Teste evento',
      description: 'teste unitário',
      startDateTime: String(new Date()),
      userId: 1,
      categoryId: 1,
      capacity: 300,
      location: 'Rua do limoeiro, 12',
      price: 10,
    };

    prisma.event.create.mockResolvedValueOnce(expectedOutputEvent);

    const event = await service.create(newEvent);

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should update an event', async () => {
    const newUpdatedEvent = {
      ...expectedOutputEvent,
      ...updateEventData,
    };

    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);
    prisma.event.update.mockResolvedValueOnce(newUpdatedEvent);

    const updatedEvent = await service.update(1, 1, updateEventData);

    expect(updatedEvent).toStrictEqual(newUpdatedEvent);
  });

  it('should throw an NotAcceptableException on different user_id for update event', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    await expect(service.update(1, 2, updateEventData)).rejects.toThrow(
      new NotAcceptableException('Você não pode editar um evento que não é seu.'),
    );
  });

  it('should throw an NotAcceptableException on lower capacity than quantity_left for update event', async () => {
    const wrongCapacityData = {
      ...updateEventData,
      capacity: 100,
    };

    prisma.event.findFirst.mockResolvedValueOnce({ ...expectedOutputEvent, quantity_left: 50 });

    await expect(service.update(1, 1, wrongCapacityData)).rejects.toThrow(
      new NotAcceptableException(
        'A capacidade do evento não pode ser menor do que a quantidade de ingressos já comprados.',
      ),
    );
  });

  it('should throw an NotAcceptableException on earlier start date than now for update event', async () => {
    const currentDate = new Date();
    const wrongStartDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));

    const wrongStartDateData = {
      ...updateEventData,
      startDateTime: String(wrongStartDate),
    };

    prisma.event.findFirst.mockResolvedValueOnce({ ...expectedOutputEvent, quantity_left: 50 });

    await expect(service.update(1, 1, wrongStartDateData)).rejects.toThrow(
      new NotAcceptableException('A data de inicio do evento não pode ser antes de hoje.'),
    );
  });

  it('should delete an event', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);
    prisma.event.update.mockResolvedValue({ ...expectedOutputEvent, active: false });

    const event = await service.delete(1, 1);

    expect(event).toHaveProperty('active', false);
  });

  it('should throw a NotAcceptableException on delete an event', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    await expect(service.delete(1, 2)).rejects.toThrow(
      new NotAcceptableException('Você não pode deletar um evento que não é seu.'),
    );
  });

  it('should find all events', async () => {
    const returnedEventsData = {
      ...expectedOutputEvent,
      category: expectedOutputCategory,
    };

    prisma.event.findMany.mockResolvedValueOnce([returnedEventsData]);

    const queryEventDto = new QueryEventDto();

    const events = await service.findAll({ skip: 0, take: 10, mountWhere: queryEventDto.mountWhere });

    expect(events).toHaveProperty('content');
    expect(events.content).toStrictEqual([returnedEventsData]);
  });

  it('should find an event by id', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    const event = await service.findById(1);

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should throw an NotFound error on find event by id', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(null);

    await expect(service.findById(1)).rejects.toThrow(new NotFoundError('Evento não encontrado'));
  });

  it('should find an event by slug', async () => {
    prisma.event.findFirst.mockImplementation(request => {
      if (request.where.slug === expectedOutputEvent.slug) {
        return expectedOutputEvent;
      }

      return null;
    });

    const event = await service.findBySlug('teste-evento');

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should throw an NotFound error on find event by slug', async () => {
    prisma.event.findFirst.mockImplementation(slug => {
      if (slug === expectedOutputEvent.slug) {
        return expectedOutputEvent;
      }

      return null;
    });

    await expect(service.findBySlug('teste')).rejects.toThrow(new NotFoundError('Evento não encontrado'));
  });

  it('should buy a ticket for en event', async () => {
    const ticket: BuyEventTicketDto = {
      eventId: 1,
      paymentMethodId: 1,
      quantity: 3,
      userId: 1,
    };

    const newUpdatedEvent = {
      ...expectedOutputEvent,
      quantity_left: expectedOutputEvent.quantity_left - ticket.quantity,
      tickets: Array.from({ length: ticket.quantity }, () => ({
        id: 1,
        event_id: 1,
        user_id: 1,
        price: 10,
        payment_method_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    };

    prisma.event.findFirst.mockResolvedValue(expectedOutputEvent);
    prisma.event.update.mockResolvedValueOnce(newUpdatedEvent);

    const purchasedTickets = await service.buyTicket(ticket);

    expect(purchasedTickets).toStrictEqual(newUpdatedEvent);
  });

  it('should throw an NotFoundError on wrong eventId at buyTicket', async () => {
    const ticket: BuyEventTicketDto = {
      eventId: 2,
      paymentMethodId: 1,
      quantity: 3,
      userId: 1,
    };

    prisma.event.findFirst.mockImplementation(request => {
      if (request.where.id === expectedOutputEvent.id) return expectedOutputEvent;

      return null;
    });

    await expect(service.buyTicket(ticket)).rejects.toThrow(new NotFoundError('Evento não encontrado'));
  });

  it('should find all categories', async () => {
    prisma.eventCategory.findMany.mockResolvedValue([expectedOutputCategory]);

    const categories = await categoryService.findAll();

    expect(categories).toStrictEqual([expectedOutputCategory]);
  });

  it('should find a category by id', async () => {
    prisma.eventCategory.findFirst.mockResolvedValue(expectedOutputCategory);

    const category = await categoryService.findById(1);

    expect(category).toStrictEqual(expectedOutputCategory);
  });
});
