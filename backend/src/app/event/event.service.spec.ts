import { CategoryRepository } from './repositories/categories.repository.js';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { EventService } from './event.service.js';
import { EventRepository } from './repositories/events.repository.js';
import { PrismaService } from '../../db/prisma.service.js';
import { PrismaClientMock } from '../../db/prisma.mock.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import { UserTypeEnum } from '@golden-events/shared';
import { BuyEventTicketDto } from './dto/buy-ticket.dto.js';
import { CategoryService } from './category.service.js';
import { PaymentMethodService } from './payment-method.service.js';
import { PaymentMethodRepository } from './repositories/payment-methods.repository.js';

describe('EventService', () => {
  let service: EventService;
  let categoryService: CategoryService;
  let paymentMethodService: PaymentMethodService;
  let prisma: PrismaClientMock;
  let expectedOutputEvent: any;
  let expectedOutputCategory: any;
  let updateEventData: any;

  const upcomingEvent = () => ({
    ...expectedOutputEvent,
    start_date: new Date(Date.now() + 86_400_000),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        CategoryService,
        EventRepository,
        CategoryRepository,
        PaymentMethodService,
        PaymentMethodRepository,
        PrismaService,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<EventService>(EventService);
    categoryService = module.get<CategoryService>(CategoryService);
    paymentMethodService = module.get<PaymentMethodService>(PaymentMethodService);
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
      startDateTime: newStartDate,
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

  const organizer = { id: 1, user_type_id: UserTypeEnum.ORGANIZER };
  const createEventData: CreateEventDto = {
    name: 'Teste evento',
    description: 'teste unitário',
    startDateTime: new Date().toISOString(),
    userId: 1,
    categoryId: 1,
    capacity: 300,
    location: 'Rua do limoeiro, 12',
    price: 10,
  };

  it('should create an event', async () => {
    prisma.event.create.mockResolvedValueOnce(expectedOutputEvent);

    const event = await service.create(organizer, createEventData);

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should throw a ForbiddenException when a non-organizer creates an event', async () => {
    await expect(
      service.create({ id: 1, user_type_id: UserTypeEnum.USER }, createEventData),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('should throw a NotFoundError when the category does not exist', async () => {
    prisma.eventCategory.findFirst.mockReset();
    prisma.eventCategory.findFirst.mockResolvedValueOnce(null);

    await expect(service.create(organizer, createEventData)).rejects.toThrow(
      'Categoria não encontrada.',
    );
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it.each([
    ['Uma noite para celebrar a música', 'Uma noite para celebrar a música'],
    [undefined, null],
    ['', null],
  ])('should create an event with subtitle "%s" saved as %p', async (subtitle, saved) => {
    prisma.event.create.mockResolvedValueOnce(expectedOutputEvent);

    await service.create(organizer, { ...createEventData, subtitle });

    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ subtitle: saved }),
    });
  });

  it.each([
    ['Novo subtítulo', 'Novo subtítulo'],
    [null, null],
  ])('should update the subtitle to %p', async (subtitle, saved) => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);
    prisma.event.update.mockResolvedValueOnce(expectedOutputEvent);

    await service.update(1, 1, { subtitle });

    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subtitle: saved }) }),
    );
  });

  it('should keep the subtitle when it is not sent on update', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);
    prisma.event.update.mockResolvedValueOnce(expectedOutputEvent);

    await service.update(1, 1, { name: 'Outro nome' });

    expect(prisma.event.update.mock.calls[0][0].data).not.toHaveProperty('subtitle');
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

    prisma.event.findFirst.mockResolvedValueOnce({
      ...expectedOutputEvent,
      quantity_left: 50,
    });

    await expect(service.update(1, 1, wrongCapacityData)).rejects.toThrow(
      new NotAcceptableException(
        'A capacidade do evento não pode ser menor do que a quantidade de ingressos já comprados.',
      ),
    );
  });

  it('should throw an NotAcceptableException on earlier end date than start date at update event', async () => {
    const currentDate = new Date();
    const startDate = new Date().setMonth(currentDate.getMonth() + 2);
    const wrongEndDate = new Date().setMonth(currentDate.getMonth() + 1);

    const wrongEndDatePayload = {
      ...updateEventData,
      startDateTime: startDate,
      endDateTime: wrongEndDate,
    };

    prisma.event.findFirst.mockResolvedValueOnce({
      ...expectedOutputEvent,
      quantity_left: 50,
    });

    await expect(service.update(1, 1, wrongEndDatePayload)).rejects.toThrow(
      new NotAcceptableException(
        'A data final do evento não pode ser antes da data de início.',
      ),
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

    const events = await service.findAll({
      skip: 0,
      take: 10,
    });

    expect(events).toHaveProperty('content');
    expect(events.content).toStrictEqual([returnedEventsData]);
  });

  it('should find only the events created by the user', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);

    await service.findAll({ skip: 0, take: 10, name: 'festival' }, 3);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ user_id: 3, name: expect.anything() }),
      }),
    );
  });

  it('should not filter by user on the public listing', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);

    await service.findAll({ skip: 0, take: 10 });

    expect(prisma.event.findMany.mock.calls[0][0].where).not.toHaveProperty('user_id');
  });

  it('should list only active events that have not started on the public listing', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);
    const before = new Date();

    await service.findAll({ skip: 0, take: 10, active: '0', start_date: new Date(0) });

    const { where } = prisma.event.findMany.mock.calls[0][0];
    expect(where.active).toBe(true);
    expect(where.start_date).toEqual({ gte: expect.any(Date) });
    expect((where.start_date as { gte: Date }).gte.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it('should keep a future start date filter on the public listing', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);
    const nextYear = new Date(Date.now() + 365 * 86_400_000);

    await service.findAll({ skip: 0, take: 10, start_date: nextYear });

    expect(prisma.event.findMany.mock.calls[0][0].where.start_date).toEqual({
      gte: nextYear,
    });
  });

  it('should list past events to their organizer', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);

    await service.findAll({ skip: 0, take: 10 }, 3);

    expect(prisma.event.findMany.mock.calls[0][0].where).not.toHaveProperty('start_date');
  });

  it.each([
    [undefined, [{ start_date: 'asc' }, { id: 'asc' }]],
    ['start_date', [{ start_date: 'asc' }, { id: 'asc' }]],
    ['created_at', [{ created_at: 'desc' }, { id: 'desc' }]],
    ['price', [{ price: 'asc' }, { start_date: 'asc' }, { id: 'asc' }]],
  ] as const)('should sort the events by %s', async (sort, orderBy) => {
    prisma.event.findMany.mockResolvedValueOnce([]);

    await service.findAll({ skip: 0, take: 10, sort });

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy }),
    );
  });

  it('should find an event by id', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    const event = await service.findById(1);

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should throw an NotFound error on find event by id', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(null);

    await expect(service.findById(1)).rejects.toThrow(
      new NotFoundError('Evento não encontrado'),
    );
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
    expect(prisma.event.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          category: true,
          user: { select: { id: true, name: true } },
        },
      }),
    );
  });

  it('should throw an NotFound error on find event by slug', async () => {
    prisma.event.findFirst.mockImplementation(slug => {
      if (slug === expectedOutputEvent.slug) {
        return expectedOutputEvent;
      }

      return null;
    });

    await expect(service.findBySlug('teste')).rejects.toThrow(
      new NotFoundError('Evento não encontrado'),
    );
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

    prisma.event.findFirst.mockResolvedValue(upcomingEvent());
    prisma.event.update.mockResolvedValueOnce(newUpdatedEvent);

    const purchasedTickets = await service.buyTicket(ticket);

    expect(purchasedTickets).toStrictEqual(newUpdatedEvent);
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          quantity_left: { decrement: 3 },
          tickets: {
            createMany: {
              data: Array.from({ length: 3 }, () => ({
                user_id: 1,
                payment_method_id: 1,
                price: 10,
              })),
            },
          },
        },
      }),
    );
  });

  it.each([
    [
      'an event that already started',
      { start_date: new Date(Date.now() - 60_000) },
      'Não é possível comprar ingressos para um evento que já começou.',
    ],
    [
      'an inactive event',
      { active: false, start_date: new Date(Date.now() + 86_400_000) },
      'As vendas deste evento estão encerradas.',
    ],
  ])('should not buy tickets for %s', async (_, event, message) => {
    prisma.event.findFirst.mockResolvedValue({ ...expectedOutputEvent, ...event });

    await expect(
      service.buyTicket({ eventId: 1, paymentMethodId: 1, quantity: 1, userId: 1 }),
    ).rejects.toThrow(new NotAcceptableException(message));
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('should not buy more tickets than are left', async () => {
    prisma.event.findFirst.mockResolvedValue({
      ...upcomingEvent(),
      quantity_left: 2,
    });

    await expect(
      service.buyTicket({ eventId: 1, paymentMethodId: 1, quantity: 3, userId: 1 }),
    ).rejects.toThrow(
      new NotAcceptableException(
        'Não há ingressos suficientes disponíveis para esta compra.',
      ),
    );
    expect(prisma.event.update).not.toHaveBeenCalled();
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

    await expect(service.buyTicket(ticket)).rejects.toThrow(
      new NotFoundError('Evento não encontrado'),
    );
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

  it('should find all payment methods', async () => {
    const paymentMethods = [
      { id: 1, name: 'Boleto' },
      { id: 2, name: 'Pix' },
    ];
    prisma.paymentMethod.findMany.mockResolvedValue(paymentMethods);

    expect(await paymentMethodService.findAll()).toStrictEqual(paymentMethods);
  });

  it('should throw a ForbiddenException when a non-organizer asks for metrics', async () => {
    await expect(
      service.getOrganizerMetrics({ id: 1, user_type_id: UserTypeEnum.USER }, 7),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should compute the organizer metrics', async () => {
    prisma.ticket.aggregate
      .mockResolvedValueOnce({ _count: 12, _sum: { price: 600 } } as never)
      .mockResolvedValueOnce({ _count: 6, _sum: { price: 300 } } as never)
      .mockResolvedValueOnce({ _count: 4, _sum: { price: 0 } } as never);
    prisma.ticket.findMany
      .mockResolvedValueOnce([{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }] as never)
      .mockResolvedValueOnce([{ user_id: 1 }] as never)
      .mockResolvedValueOnce([{ user_id: 2 }, { user_id: 3 }] as never)
      .mockResolvedValueOnce([
        { created_at: new Date() },
        { created_at: new Date() },
      ] as never);
    prisma.event.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const metrics = await service.getOrganizerMetrics(
      { id: 1, user_type_id: UserTypeEnum.ORGANIZER },
      7,
    );

    expect(metrics.ticketsSold).toStrictEqual({ total: 12, change: 50 });
    expect(metrics.revenue).toStrictEqual({ total: 600, change: null });
    expect(metrics.audience).toStrictEqual({ total: 3, change: -50 });
    expect(metrics.activeEvents).toStrictEqual({ total: 5, createdThisMonth: 2 });
    expect(metrics.dailySales).toHaveLength(7);
    expect(metrics.dailySales.at(-1).tickets).toBe(2);
  });
});
