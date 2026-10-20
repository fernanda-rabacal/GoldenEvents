import { BusinessRuleError } from '../../common/errors/types/BusinessRuleError.js';
import { NotFoundError } from '../../common/errors/types/NotFoundError.js';

type SalesWindow = { name: string; salesStart?: Date | null; salesEnd?: Date | null };
type SavedLot = { id: number; name: string; quantity: number; quantity_left: number };
type LotChange = { id?: number; quantity: number };

export function validateSalesWindows(
  sectors: { lots: SalesWindow[] }[],
  eventStart: Date,
) {
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

export function validateEventDates(start?: Date | string, end?: Date | string) {
  if (start && end && +new Date(start) > +new Date(end)) {
    throw new BusinessRuleError(
      'A data final do evento não pode ser antes da data de início.',
    );
  }
}

export function validateSectorChanges(
  saved: { id: number; lots: SavedLot[] }[],
  sectors: { id?: number; lots: LotChange[] }[],
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
