import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';
import { CreateEventDto } from '../dto/create-event.dto.js';
import { generateSlug } from '../../../util/slug.js';
import { QueryEventDto } from '../dto/query-event.dto.js';
import { UpdateEventDto } from '../dto/update-event.dto.js';
import { CreateLotDto } from '../dto/lot.dto.js';
import { UpdateSectorDto } from '../dto/sector.dto.js';
import { Prisma } from '@prisma/client';
import { summarizeLots, type EventSort } from '@golden-events/shared';
import { OutboxService } from '../../../shared/outbox/outbox.service.js';
import { EVENT_CANCELLED } from '../event.events.js';

export type LotQuantity = { lotId: number; quantity: number };

const EVENT_ORDER_BY: Record<EventSort, Prisma.EventOrderByWithRelationInput[]> = {
  start_date: [{ start_date: 'asc' }, { id: 'asc' }],
  created_at: [{ created_at: 'desc' }, { id: 'desc' }],
  price: [{ min_price: 'asc' }, { start_date: 'asc' }, { id: 'asc' }],
};

const SECTORS_WITH_LOTS = {
  orderBy: [{ position: 'asc' }, { id: 'asc' }],
  include: { lots: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
} satisfies Prisma.Event$sectorsArgs;

function toLotData(lot: CreateLotDto, position: number) {
  return {
    name: lot.name,
    price: lot.price,
    quantity: lot.quantity,
    position,
    sales_start: lot.salesStart ?? null,
    sales_end: lot.salesEnd ?? null,
  };
}

@Injectable()
export class EventRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const lots = createEventDto.sectors.flatMap(({ lots }) =>
      lots.map(lot => ({ ...lot, quantity_left: lot.quantity, sales_end: lot.salesEnd })),
    );

    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
        subtitle: createEventDto.subtitle || null,
        start_date: createEventDto.startDateTime,
        end_date: createEventDto.endDateTime,
        description: createEventDto.description,
        category_id: createEventDto.categoryId,
        user_id: createEventDto.userId,
        location: createEventDto.location,
        slug: generateSlug(createEventDto.name),
        ...summarizeLots(lots),
        sectors: {
          create: createEventDto.sectors.map((sector, position) => ({
            name: sector.name,
            position,
            lots: {
              create: sector.lots.map((lot, lotPosition) => ({
                ...toLotData(lot, lotPosition),
                quantity_left: lot.quantity,
              })),
            },
          })),
        },
      },
      include: { sectors: SECTORS_WITH_LOTS },
    });

    return event;
  }

  async findAll(query: QueryEventDto, userId?: number) {
    let where = {};

    if (userId) {
      where = { ...where, user_id: userId };
    }

    if (query.name) {
      where = {
        ...where,
        name: {
          contains: query.name,
          mode: 'insensitive',
        },
      };
    }

    if (query.active) {
      where = {
        ...where,
        active: Boolean(Number(query.active)),
      };
    }

    if (query.category_id) {
      where = {
        ...where,
        category_id: Number(query.category_id),
      };
    }

    // A listagem pública só mostra eventos ativos que ainda não começaram; o organizador vê todos os seus
    if (!userId) {
      const now = new Date();
      const requestedStart = query.start_date ? new Date(query.start_date) : now;

      where = {
        ...where,
        active: true,
        start_date: { gte: requestedStart > now ? requestedStart : now },
      };
    } else if (query.start_date) {
      where = {
        ...where,
        start_date: {
          gte: new Date(query.start_date),
        },
      };
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: EVENT_ORDER_BY[query.sort ?? 'start_date'],
      include: {
        category: true,
      },
    });

    return events;
  }

  async findById(id: number) {
    return this.prisma.event.findFirst({
      where: {
        id,
      },
      include: { sectors: SECTORS_WITH_LOTS },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.event.findFirst({
      where: {
        slug,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
        sectors: SECTORS_WITH_LOTS,
      },
    });
  }

  async findByLotIds(lotIds: number[]) {
    return this.prisma.event.findFirst({
      where: { sectors: { some: { lots: { some: { id: { in: lotIds } } } } } },
      include: { sectors: SECTORS_WITH_LOTS },
    });
  }

  async findNamesByOrganizer(userId: number) {
    return this.prisma.event.findMany({
      where: { user_id: userId },
      orderBy: { start_date: 'desc' },
      select: { id: true, name: true },
    });
  }

  async findLotLabels(lotIds: number[]) {
    return this.prisma.lot.findMany({
      where: { id: { in: lotIds } },
      select: { id: true, name: true, sector: { select: { name: true } } },
    });
  }

  // Tudo ou nada: false quando algum lote não tem estoque. Roda na transação de quem
  // reserva (o pedido), então a reserva só existe se o pedido existir
  async reserveLots(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    await this.lockEvent(tx, eventId);

    const lots = await tx.lot.findMany({
      where: {
        id: { in: items.map(({ lotId }) => lotId) },
        sector: { event_id: eventId },
      },
      select: { id: true, quantity_left: true },
    });
    const left = new Map(lots.map(({ id, quantity_left }) => [id, quantity_left]));

    if (items.some(({ lotId, quantity }) => (left.get(lotId) ?? 0) < quantity)) {
      return false;
    }

    for (const { lotId, quantity } of items) {
      // UPDATE condicional: mesmo que outra escrita escape do lock, o estoque nunca fica negativo
      const { count } = await tx.lot.updateMany({
        where: { id: lotId, quantity_left: { gte: quantity } },
        data: { quantity_left: { decrement: quantity } },
      });

      if (count === 0) {
        throw new Error(`O lote ${lotId} perdeu o estoque durante a reserva.`);
      }
    }

    await tx.event.update({
      where: { id: eventId },
      data: await this.summarizeEventLots(tx, eventId),
    });

    return true;
  }

  async releaseLots(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    await this.lockEvent(tx, eventId);

    for (const { lotId, quantity } of items) {
      await tx.lot.updateMany({
        where: { id: lotId, sector: { event_id: eventId } },
        data: { quantity_left: { increment: quantity } },
      });
    }

    await tx.event.update({
      where: { id: eventId },
      data: await this.summarizeEventLots(tx, eventId),
    });
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const data: Prisma.EventUpdateInput = {};

    if (updateEventDto.name) {
      data.name = updateEventDto.name;
    }

    // null (ou texto vazio) remove o subtítulo; ausente mantém o atual
    if (updateEventDto.subtitle !== undefined) {
      data.subtitle = updateEventDto.subtitle || null;
    }

    if (updateEventDto.description) {
      data.description = updateEventDto.description;
    }

    if (updateEventDto.startDateTime) {
      data.start_date = updateEventDto.startDateTime;
    }

    if (updateEventDto.endDateTime) {
      data.end_date = updateEventDto.endDateTime;
    }

    if (updateEventDto.categoryId) {
      data.category = {
        connect: {
          id: updateEventDto.categoryId,
        },
      };
    }

    if (updateEventDto.location) {
      data.location = updateEventDto.location;
    }

    return this.prisma.$transaction(async tx => {
      await this.lockEvent(tx, id);

      if (updateEventDto.sectors) {
        await this.syncSectors(tx, id, updateEventDto.sectors);
      }

      return tx.event.update({
        where: {
          id,
        },
        data: { ...data, ...(await this.summarizeEventLots(tx, id)) },
        include: { sectors: SECTORS_WITH_LOTS },
      });
    });
  }

  async delete(id: number, cancelSales: boolean) {
    return this.prisma.$transaction(async tx => {
      const event = await tx.event.update({
        data: {
          active: false,
        },
        where: {
          id: id,
        },
      });

      if (cancelSales) {
        await this.outbox.add(tx, EVENT_CANCELLED, { eventId: id });
      }

      return event;
    });
  }

  async getTicketStats(userId: number, from?: Date, to?: Date) {
    const where: Prisma.TicketWhereInput = {
      event: { user_id: userId },
      status: { not: 'cancelled' },
      created_at: { gte: from, lt: to },
    };

    const [totals, buyers] = await Promise.all([
      this.prisma.ticket.aggregate({ where, _count: true, _sum: { price: true } }),
      this.prisma.ticket.findMany({
        where,
        distinct: ['user_id'],
        select: { user_id: true },
      }),
    ]);

    return {
      tickets: totals._count,
      revenue: totals._sum.price ?? 0,
      audience: buyers.length,
    };
  }

  async countActiveEvents(userId: number, now: Date, createdSince?: Date) {
    return this.prisma.event.count({
      where: {
        user_id: userId,
        active: true,
        created_at: { gte: createdSince },
        OR: [{ end_date: { gte: now } }, { end_date: null, start_date: { gte: now } }],
      },
    });
  }

  async findTicketDatesSince(userId: number, since: Date) {
    return this.prisma.ticket.findMany({
      where: {
        event: { user_id: userId },
        status: { not: 'cancelled' },
        created_at: { gte: since },
      },
      select: { created_at: true },
    });
  }

  async getTicketStatsByLot(eventId: number) {
    const groups = await this.prisma.ticket.groupBy({
      by: ['lot_id'],
      where: { event_id: eventId, status: { not: 'cancelled' } },
      _count: { _all: true },
      _sum: { price: true },
    });

    return groups.map(({ lot_id, _count, _sum }) => ({
      lotId: lot_id,
      sold: _count._all,
      revenue: _sum.price ?? 0,
    }));
  }

  // Serializa as escritas de um evento: sem isso, duas compras simultâneas recalculariam os totais com leituras desatualizadas
  private async lockEvent(tx: Prisma.TransactionClient, id: number) {
    await tx.$queryRaw`SELECT id FROM "event" WHERE id = ${id} FOR UPDATE`;
  }

  private async summarizeEventLots(tx: Prisma.TransactionClient, eventId: number) {
    const lots = await tx.lot.findMany({
      where: { sector: { event_id: eventId } },
      select: { price: true, quantity: true, quantity_left: true, sales_end: true },
    });

    return summarizeLots(lots);
  }

  // Quem chama já validou que os ids são do evento e que nada vendido é removido ou reduzido demais
  private async syncSectors(
    tx: Prisma.TransactionClient,
    eventId: number,
    sectors: UpdateSectorDto[],
  ) {
    const savedLots = await tx.lot.findMany({
      where: { sector: { event_id: eventId } },
      select: { id: true, quantity: true },
    });
    const savedQuantities = new Map(savedLots.map(({ id, quantity }) => [id, quantity]));
    const keptSectorIds: number[] = [];
    const keptLotIds = sectors.flatMap(({ lots }) =>
      lots.flatMap(({ id }) => (id ? [id] : [])),
    );

    await tx.lot.deleteMany({
      where: { sector: { event_id: eventId }, id: { notIn: keptLotIds } },
    });

    for (const [position, sector] of sectors.entries()) {
      const { id: sectorId } = sector.id
        ? await tx.sector.update({
            where: { id: sector.id },
            data: { name: sector.name, position },
          })
        : await tx.sector.create({
            data: { event_id: eventId, name: sector.name, position },
          });

      keptSectorIds.push(sectorId);

      for (const [lotPosition, lot] of sector.lots.entries()) {
        const lotData = { ...toLotData(lot, lotPosition), sector_id: sectorId };

        if (lot.id) {
          // increment, e não um valor fixo, para não desfazer vendas feitas desde a leitura
          await tx.lot.update({
            where: { id: lot.id },
            data: {
              ...lotData,
              quantity_left: { increment: lot.quantity - savedQuantities.get(lot.id) },
            },
          });
        } else {
          await tx.lot.create({ data: { ...lotData, quantity_left: lot.quantity } });
        }
      }
    }

    // Por último: um lote movido de um setor removido já mudou de setor e não cai no cascade
    await tx.sector.deleteMany({
      where: { event_id: eventId, id: { notIn: keptSectorIds } },
    });
  }
}
