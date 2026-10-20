import { Injectable } from '@nestjs/common';
import type { Lot, Sector } from '@prisma/client';
import { canManageEvents } from '@golden-events/shared';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { CreateLotDto } from './dto/lot.dto.js';
import { UpdateSectorDto } from './dto/sector.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { EventRepository } from './repositories/events.repository.js';
import { BusinessRuleError } from '../common/errors/types/BusinessRuleError.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { OffsetPagination } from '../../response/pagination.response.js';
import type { Requester } from '../common/auth/requester.js';

type SalesWindow = Pick<CreateLotDto, 'name' | 'salesStart' | 'salesEnd'>;

function validateSalesWindows(sectors: { lots: SalesWindow[] }[], eventStart: Date) {
  for (const { name, salesStart, salesEnd } of sectors.flatMap(({ lots }) => lots)) {
    if (salesStart && salesEnd && salesEnd <= salesStart) {
      throw new BusinessRuleError(
        `O fim das vendas do lote "${name}" precisa ser depois do início.`,
      );
    }

    if (salesEnd && salesEnd > eventStart) {
      throw new BusinessRuleError(
        `As vendas do lote "${name}" não podem terminar depois do início do evento.`,
      );
    }
  }
}

function validateSectorChanges(
  saved: (Sector & { lots: Lot[] })[],
  sectors: UpdateSectorDto[],
) {
  const savedSectorIds = new Set(saved.map(({ id }) => id));
  const savedLots = new Map(saved.flatMap(({ lots }) => lots).map(lot => [lot.id, lot]));
  const keptLotIds = new Set<number>();

  for (const sector of sectors) {
    if (sector.id && !savedSectorIds.has(sector.id)) {
      throw new NotFoundError('Setor não encontrado.');
    }

    for (const lot of sector.lots.filter(({ id }) => id)) {
      const savedLot = savedLots.get(lot.id);

      if (!savedLot) {
        throw new NotFoundError('Lote não encontrado.');
      }

      const sold = savedLot.quantity - savedLot.quantity_left;

      if (lot.quantity < sold) {
        throw new BusinessRuleError(
          `O lote "${savedLot.name}" já vendeu ${sold} ingressos e não pode ter uma quantidade menor que isso.`,
        );
      }

      keptLotIds.add(lot.id);
    }
  }

  const removedSoldLot = [...savedLots.values()].find(
    lot => !keptLotIds.has(lot.id) && lot.quantity_left < lot.quantity,
  );

  if (removedSoldLot) {
    throw new BusinessRuleError(
      `O lote "${removedSoldLot.name}" já tem ingressos vendidos e não pode ser removido.`,
    );
  }
}

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(requester: Requester, createEventDto: CreateEventDto) {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores podem criar eventos.');
    }

    const category = await this.categoryRepository.findById(createEventDto.categoryId);

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    validateSalesWindows(createEventDto.sectors, new Date(createEventDto.startDateTime));

    return this.repository.create(requester.id, createEventDto);
  }

  async findAll(query: QueryEventDto, userId?: number) {
    const events = await this.repository.findAll(query, userId);

    const totalRecords = events.length;

    const paginator = new OffsetPagination(
      totalRecords,
      totalRecords,
      query.skip,
      query.take,
    );

    return paginator.paginate(events);
  }

  async findById(eventId: number) {
    const event = await this.repository.findById(eventId);

    if (!event) {
      throw new NotFoundError('Evento não encontrado');
    }

    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.repository.findBySlug(slug);

    if (!event) {
      throw new NotFoundError('Evento não encontrado');
    }

    return event;
  }

  async update(requester: Requester, id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findById(id);

    if (event.user_id !== requester.id) {
      throw new ForbiddenError('Você não pode editar um evento que não é seu.');
    }

    if (updateEventDto.sectors) {
      validateSectorChanges(event.sectors, updateEventDto.sectors);
    }

    if (updateEventDto.sectors || updateEventDto.startDateTime) {
      validateSalesWindows(
        updateEventDto.sectors ??
          event.sectors.map(({ lots }) => ({
            lots: lots.map(({ name, sales_start, sales_end }) => ({
              name,
              salesStart: sales_start,
              salesEnd: sales_end,
            })),
          })),
        new Date(updateEventDto.startDateTime ?? event.start_date),
      );
    }

    if (
      updateEventDto.startDateTime &&
      updateEventDto.endDateTime &&
      +updateEventDto.startDateTime > +updateEventDto.endDateTime
    ) {
      throw new BusinessRuleError(
        'A data final do evento não pode ser antes da data de início.',
      );
    }

    return this.repository.update(id, updateEventDto);
  }

  async delete(requester: Requester, id: number) {
    const { user_id, active, start_date } = await this.findById(id);

    if (user_id !== requester.id) {
      throw new ForbiddenError('Você não pode deletar um evento que não é seu.');
    }

    // Só um evento que ainda não aconteceu é cancelado (com estorno dos pedidos);
    // apagar um evento passado apenas o esconde
    return this.repository.delete(id, active && start_date > new Date());
  }
}
