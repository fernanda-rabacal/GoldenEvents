import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';
import { generateSlug } from '../../common/utils/slug.util.js';
import type {
  CreateEventInput,
  EventListQuery,
  LotInput,
  SectorInput,
  UpdateEventInput,
} from '../application/event-inputs.js';
import { Prisma } from '@prisma/client';
import { summarizeLots, type EventSort } from '@golden-events/shared';

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

function toLotData(lot: LotInput, position: number) {
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
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, input: CreateEventInput) {
    const lots = input.sectors.flatMap(({ lots }) =>
      lots.map(lot => ({ ...lot, quantity_left: lot.quantity, sales_end: lot.salesEnd })),
    );

    const event = await this.prisma.event.create({
      data: {
        name: input.name,
        subtitle: input.subtitle || null,
        start_date: input.startDateTime,
        end_date: input.endDateTime,
        description: input.description,
        category_id: input.categoryId,
        user_id: userId,
        location: input.location,
        slug: generateSlug(input.name),
        ...summarizeLots(lots),
        sectors: {
          create: input.sectors.map((sector, position) => ({
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

  async findPage(
    query: EventListQuery,
    userId: number | undefined,
    skip: number,
    take: number,
  ) {
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

    return this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: EVENT_ORDER_BY[query.sort ?? 'start_date'],
        include: { category: true },
        skip,
        take,
      }),
    ]);
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

  async findSummaries(ids: number[]) {
    return this.prisma.event.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        photo: true,
        start_date: true,
        end_date: true,
        location: true,
        category: { select: { name: true } },
      },
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

  async update(id: number, input: UpdateEventInput) {
    const data: Prisma.EventUpdateInput = {};

    if (input.name) {
      data.name = input.name;
    }

    // null (ou texto vazio) remove o subtítulo; ausente mantém o atual
    if (input.subtitle !== undefined) {
      data.subtitle = input.subtitle || null;
    }

    if (input.description) {
      data.description = input.description;
    }

    if (input.startDateTime) {
      data.start_date = input.startDateTime;
    }

    if (input.endDateTime) {
      data.end_date = input.endDateTime;
    }

    if (input.categoryId) {
      data.category = {
        connect: {
          id: input.categoryId,
        },
      };
    }

    if (input.location) {
      data.location = input.location;
    }

    return this.prisma.$transaction(async tx => {
      await this.lockEvent(tx, id);

      if (input.sectors) {
        await this.syncSectors(tx, id, input.sectors);
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

  async deactivate(tx: Prisma.TransactionClient, id: number) {
    return tx.event.update({ where: { id }, data: { active: false } });
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
    sectors: SectorInput[],
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
