import { CategoryRepository } from './repositories/categories.repository.js';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { EventService } from './event.service.js';
import { EventRepository } from './repositories/events.repository.js';
import { PrismaService } from '../../db/prisma.service.js';
import { PrismaClientMock } from '../../db/prisma.mock.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateSectorDto } from './dto/sector.dto.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { BusinessRuleError } from '../common/errors/types/BusinessRuleError.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';
import { UserTypeEnum } from '@golden-events/shared';
import { BuyEventTicketDto } from './dto/buy-ticket.dto.js';
import { CategoryService } from './category.service.js';
import { PaymentMethodService } from './payment-method.service.js';
import { PaymentMethodRepository } from './repositories/payment-methods.repository.js';

const DAY_MS = 86_400_000;
const NOT_ENOUGH_TICKETS = 'Não há ingressos suficientes disponíveis para esta compra.';

function buildLot(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    sector_id: 1,
    name: '1º lote',
    price: 4500,
    quantity: 100,
    quantity_left: 100,
    position: 0,
    sales_start: null,
    sales_end: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('EventService', () => {
  let service: EventService;
  let categoryService: CategoryService;
  let paymentMethodService: PaymentMethodService;
  let prisma: PrismaClientMock;
  let expectedOutputEvent: any;
  let expectedOutputCategory: any;
  let updateEventData: any;

  const upcomingEvent = (sectors = expectedOutputEvent.sectors) => ({
    ...expectedOutputEvent,
    start_date: new Date(Date.now() + DAY_MS),
    sectors,
  });

  const pistaWithLots = (...lots: Record<string, unknown>[]) => [
    {
      id: 1,
      event_id: 1,
      name: 'Pista',
      position: 0,
      lots: lots.map(lot => buildLot(lot)),
    },
  ];

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
      capacity: 200,
      quantity_left: 200,
      min_price: 4500,
      location: 'Rua do limoeiro, 12',
      sectors: pistaWithLots(
        { id: 10, name: '1º lote', price: 4500, position: 0 },
        { id: 11, name: '2º lote', price: 6000, position: 1 },
      ),
    };

    updateEventData = {
      name: 'Teste evento 1',
      description: 'teste unitário 1',
      startDateTime: newStartDate,
      categoryId: 1,
      location: 'Rua do limoeiro, 22',
    };

    prisma.eventCategory.findFirst.mockResolvedValueOnce(expectedOutputCategory);
    prisma.eventCategory.findMany.mockResolvedValueOnce([expectedOutputCategory]);
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    prisma.lot.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const organizer = { id: 1, user_type_id: UserTypeEnum.ORGANIZER };
  const createEventData: CreateEventDto = {
    name: 'Teste evento',
    description: 'teste unitário',
    startDateTime: new Date(Date.now() + 30 * DAY_MS).toISOString(),
    userId: 1,
    categoryId: 1,
    location: 'Rua do limoeiro, 12',
    sectors: [
      {
        name: 'Pista',
        lots: [
          { name: '1º lote', price: 4500, quantity: 100 },
          { name: '2º lote', price: 6000, quantity: 100 },
        ],
      },
      { name: 'Camarote', lots: [{ name: 'Lote único', price: 15000, quantity: 50 }] },
    ],
  };

  it('should create an event', async () => {
    prisma.event.create.mockResolvedValueOnce(expectedOutputEvent);

    const event = await service.create(organizer, createEventData);

    expect(event).toStrictEqual(expectedOutputEvent);
  });

  it('should create the sectors and lots with the event totals', async () => {
    prisma.event.create.mockResolvedValueOnce(expectedOutputEvent);

    await service.create(organizer, createEventData);

    const { data } = prisma.event.create.mock.calls[0][0];
    expect(data).toEqual(
      expect.objectContaining({ capacity: 250, quantity_left: 250, min_price: 4500 }),
    );
    expect(data.sectors).toEqual({
      create: [
        {
          name: 'Pista',
          position: 0,
          lots: {
            create: [
              expect.objectContaining({
                name: '1º lote',
                price: 4500,
                position: 0,
                quantity_left: 100,
              }),
              expect.objectContaining({
                name: '2º lote',
                price: 6000,
                position: 1,
                quantity_left: 100,
              }),
            ],
          },
        },
        {
          name: 'Camarote',
          position: 1,
          lots: {
            create: [
              expect.objectContaining({
                name: 'Lote único',
                position: 0,
                quantity_left: 50,
              }),
            ],
          },
        },
      ],
    });
  });

  it.each([
    [
      'ends before it starts',
      {
        salesStart: new Date(Date.now() + 5 * DAY_MS),
        salesEnd: new Date(Date.now() + DAY_MS),
      },
      'O fim das vendas do lote "1º lote" precisa ser depois do início.',
    ],
    [
      'ends after the event starts',
      { salesEnd: new Date(Date.now() + 60 * DAY_MS) },
      'As vendas do lote "1º lote" não podem terminar depois do início do evento.',
    ],
  ])('should not create a lot whose sales window %s', async (_, window, message) => {
    await expect(
      service.create(organizer, {
        ...createEventData,
        sectors: [
          {
            name: 'Pista',
            lots: [{ name: '1º lote', price: 0, quantity: 10, ...window }],
          },
        ],
      }),
    ).rejects.toThrow(new BusinessRuleError(message));
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('should throw a ForbiddenError when a non-organizer creates an event', async () => {
    await expect(
      service.create({ id: 1, user_type_id: UserTypeEnum.USER }, createEventData),
    ).rejects.toThrow(ForbiddenError);
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

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subtitle: saved }) }),
    );
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
    expect(prisma.sector.deleteMany).not.toHaveBeenCalled();
  });

  it('should throw a ForbiddenError on different user_id for update event', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    await expect(service.update(1, 2, updateEventData)).rejects.toThrow(
      new ForbiddenError('Você não pode editar um evento que não é seu.'),
    );
  });

  describe('updating sectors and lots', () => {
    // Pista: 1º lote com 40 vendidos e 2º lote sem vendas. Camarote: sem vendas
    const savedEvent = () => ({
      ...expectedOutputEvent,
      start_date: new Date(Date.now() + 30 * DAY_MS),
      sectors: [
        ...pistaWithLots(
          { id: 10, name: '1º lote', quantity: 100, quantity_left: 60 },
          { id: 11, name: '2º lote', quantity: 100, quantity_left: 100, position: 1 },
        ),
        {
          id: 2,
          event_id: 1,
          name: 'Camarote',
          position: 1,
          lots: [
            buildLot({
              id: 20,
              sector_id: 2,
              name: 'Camarote',
              quantity: 50,
              quantity_left: 50,
            }),
          ],
        },
      ],
    });

    const lot = (overrides: Record<string, unknown> = {}) => ({
      name: '1º lote',
      price: 4500,
      quantity: 100,
      ...overrides,
    });

    async function updateSectors(sectors: UpdateSectorDto[]) {
      return service.update(1, 1, { sectors });
    }

    beforeEach(() => {
      prisma.event.findFirst.mockResolvedValueOnce(savedEvent());
      prisma.event.update.mockResolvedValueOnce(expectedOutputEvent);
    });

    it('should update, create and remove sectors and lots', async () => {
      prisma.lot.findMany.mockResolvedValueOnce([
        { id: 10, quantity: 100 },
        { id: 11, quantity: 100 },
        { id: 20, quantity: 50 },
      ] as never);
      prisma.sector.update.mockResolvedValueOnce({ id: 1 } as never);
      prisma.sector.create.mockResolvedValueOnce({ id: 3 } as never);

      await updateSectors([
        {
          id: 1,
          name: 'Pista Premium',
          lots: [lot({ id: 10, quantity: 120 }), lot({ name: '3º lote', price: 8000 })],
        },
        {
          name: 'Backstage',
          lots: [lot({ name: 'Lote único', price: 30000, quantity: 20 })],
        },
      ]);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.lot.deleteMany).toHaveBeenCalledWith({
        where: { sector: { event_id: 1 }, id: { notIn: [10] } },
      });
      expect(prisma.sector.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Pista Premium', position: 0 },
      });
      expect(prisma.lot.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: expect.objectContaining({
          quantity: 120,
          position: 0,
          sector_id: 1,
          quantity_left: { increment: 20 },
        }),
      });
      expect(prisma.lot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '3º lote',
          position: 1,
          sector_id: 1,
          quantity_left: 100,
        }),
      });
      expect(prisma.sector.create).toHaveBeenCalledWith({
        data: { event_id: 1, name: 'Backstage', position: 1 },
      });
      expect(prisma.lot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Lote único',
          sector_id: 3,
          quantity_left: 20,
        }),
      });
      expect(prisma.sector.deleteMany).toHaveBeenCalledWith({
        where: { event_id: 1, id: { notIn: [1, 3] } },
      });
    });

    it('should not remove a lot that already sold tickets', async () => {
      await expect(
        updateSectors([{ id: 1, name: 'Pista', lots: [lot({ id: 11 })] }]),
      ).rejects.toThrow(
        new BusinessRuleError(
          'O lote "1º lote" já tem ingressos vendidos e não pode ser removido.',
        ),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should not reduce a lot below the tickets already sold', async () => {
      await expect(
        updateSectors([{ id: 1, name: 'Pista', lots: [lot({ id: 10, quantity: 39 })] }]),
      ).rejects.toThrow(
        new BusinessRuleError(
          'O lote "1º lote" já vendeu 40 ingressos e não pode ter uma quantidade menor que isso.',
        ),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      [
        'sector',
        [{ id: 99, name: 'Pista', lots: [lot({ id: 10 })] }],
        'Setor não encontrado.',
      ],
      [
        'lot',
        [{ id: 1, name: 'Pista', lots: [lot({ id: 10 }), lot({ id: 99 })] }],
        'Lote não encontrado.',
      ],
    ])(
      'should throw a NotFoundError for a %s of another event',
      async (_, sectors, message) => {
        await expect(updateSectors(sectors)).rejects.toThrow(new NotFoundError(message));
        expect(prisma.$transaction).not.toHaveBeenCalled();
      },
    );

    it('should check the saved lots when only the start date changes', async () => {
      prisma.event.findFirst.mockReset();
      prisma.event.findFirst.mockResolvedValueOnce({
        ...savedEvent(),
        sectors: pistaWithLots({ sales_end: new Date(Date.now() + 10 * DAY_MS) }),
      });

      await expect(
        service.update(1, 1, {
          startDateTime: new Date(Date.now() + 5 * DAY_MS).toISOString(),
        }),
      ).rejects.toThrow(
        new BusinessRuleError(
          'As vendas do lote "1º lote" não podem terminar depois do início do evento.',
        ),
      );
    });
  });

  it('should throw a BusinessRuleError on earlier end date than start date at update event', async () => {
    const currentDate = new Date();
    const startDate = new Date().setMonth(currentDate.getMonth() + 2);
    const wrongEndDate = new Date().setMonth(currentDate.getMonth() + 1);

    const wrongEndDatePayload = {
      ...updateEventData,
      startDateTime: startDate,
      endDateTime: wrongEndDate,
    };

    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    await expect(service.update(1, 1, wrongEndDatePayload)).rejects.toThrow(
      new BusinessRuleError(
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

  it('should throw a ForbiddenError on delete an event', async () => {
    prisma.event.findFirst.mockResolvedValueOnce(expectedOutputEvent);

    await expect(service.delete(1, 2)).rejects.toThrow(
      new ForbiddenError('Você não pode deletar um evento que não é seu.'),
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
    const nextYear = new Date(Date.now() + 365 * DAY_MS);

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
    ['price', [{ min_price: 'asc' }, { start_date: 'asc' }, { id: 'asc' }]],
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

  it('should find an event by slug with its sectors and lots in order', async () => {
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
          sectors: {
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            include: { lots: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
          },
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

  describe('buying tickets', () => {
    const purchase = (overrides: Partial<BuyEventTicketDto> = {}): BuyEventTicketDto => ({
      eventId: 1,
      lotId: 10,
      paymentMethodId: 1,
      quantity: 3,
      userId: 1,
      ...overrides,
    });

    function mockPurchase() {
      prisma.lot.updateMany.mockResolvedValueOnce({ count: 3 });
      prisma.ticket.createManyAndReturn.mockResolvedValueOnce([{ id: 1 }] as never);
    }

    it('should buy tickets of the current lot at its price in cents', async () => {
      prisma.event.findFirst.mockResolvedValue(upcomingEvent());
      mockPurchase();

      const tickets = await service.buyTicket(purchase());

      expect(tickets).toStrictEqual([{ id: 1 }]);
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.lot.updateMany).toHaveBeenCalledWith({
        where: { id: 10, quantity_left: { gte: 3 } },
        data: { quantity_left: { decrement: 3 } },
      });
      expect(prisma.ticket.createManyAndReturn).toHaveBeenCalledWith({
        data: Array.from({ length: 3 }, () => ({
          event_id: 1,
          lot_id: 10,
          user_id: 1,
          payment_method_id: 1,
          price: 4500,
        })),
      });
      expect(prisma.event.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it.each([
      ['the previous lot sold out', { quantity_left: 0 }],
      ['the previous lot sales ended', { sales_end: new Date(Date.now() - 60_000) }],
    ])('should sell the next lot when %s', async (_, previousLot) => {
      prisma.event.findFirst.mockResolvedValue(
        upcomingEvent(
          pistaWithLots(
            { id: 10, ...previousLot },
            { id: 11, name: '2º lote', price: 6000, position: 1 },
          ),
        ),
      );
      mockPurchase();

      await service.buyTicket(purchase({ lotId: 11 }));

      expect(prisma.ticket.createManyAndReturn.mock.calls[0][0].data[0]).toEqual(
        expect.objectContaining({ lot_id: 11, price: 6000 }),
      );
    });

    it.each([
      ['a lot after the current one', () => upcomingEvent(), 11],
      [
        'a lot whose sales have not started',
        () =>
          upcomingEvent(
            pistaWithLots({ id: 10, sales_start: new Date(Date.now() + DAY_MS) }),
          ),
        10,
      ],
    ])('should not sell %s', async (_, buildEvent, lotId) => {
      prisma.event.findFirst.mockResolvedValue(buildEvent());

      await expect(service.buyTicket(purchase({ lotId }))).rejects.toThrow(
        new BusinessRuleError('Este lote não está à venda.'),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw a NotFoundError for a lot of another event', async () => {
      prisma.event.findFirst.mockResolvedValue(upcomingEvent());

      await expect(service.buyTicket(purchase({ lotId: 99 }))).rejects.toThrow(
        new NotFoundError('Lote não encontrado.'),
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
        { active: false, start_date: new Date(Date.now() + DAY_MS) },
        'As vendas deste evento estão encerradas.',
      ],
    ])('should not buy tickets for %s', async (_, event, message) => {
      prisma.event.findFirst.mockResolvedValue({ ...expectedOutputEvent, ...event });

      await expect(service.buyTicket(purchase({ quantity: 1 }))).rejects.toThrow(
        new BusinessRuleError(message),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should not buy more tickets than are left in the lot', async () => {
      prisma.event.findFirst.mockResolvedValue(
        upcomingEvent(pistaWithLots({ id: 10, quantity_left: 2 })),
      );

      await expect(service.buyTicket(purchase())).rejects.toThrow(
        new BusinessRuleError(NOT_ENOUGH_TICKETS),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should not create tickets when another purchase took the lot first', async () => {
      prisma.event.findFirst.mockResolvedValue(upcomingEvent());
      prisma.lot.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.buyTicket(purchase())).rejects.toThrow(
        new BusinessRuleError(NOT_ENOUGH_TICKETS),
      );
      expect(prisma.ticket.createManyAndReturn).not.toHaveBeenCalled();
      expect(prisma.event.update).not.toHaveBeenCalled();
    });

    it('should throw an NotFoundError on wrong eventId at buyTicket', async () => {
      prisma.event.findFirst.mockImplementation(request => {
        if (request.where.id === expectedOutputEvent.id) return expectedOutputEvent;

        return null;
      });

      await expect(service.buyTicket(purchase({ eventId: 2 }))).rejects.toThrow(
        new NotFoundError('Evento não encontrado'),
      );
    });
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

  it('should throw a ForbiddenError when a non-organizer asks for metrics', async () => {
    await expect(
      service.getOrganizerMetrics({ id: 1, user_type_id: UserTypeEnum.USER }, 7),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should compute the organizer metrics', async () => {
    prisma.ticket.aggregate
      .mockResolvedValueOnce({ _count: 12, _sum: { price: 60000 } } as never)
      .mockResolvedValueOnce({ _count: 6, _sum: { price: 30000 } } as never)
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
    expect(metrics.revenue).toStrictEqual({ total: 60000, change: null });
    expect(metrics.audience).toStrictEqual({ total: 3, change: -50 });
    expect(metrics.activeEvents).toStrictEqual({ total: 5, createdThisMonth: 2 });
    expect(metrics.dailySales).toHaveLength(7);
    expect(metrics.dailySales.at(-1).tickets).toBe(2);
  });
});
