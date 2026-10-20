import type { EventSort } from '@golden-events/shared';

// Entradas dos casos de uso de eventos; os DTOs HTTP implementam estes tipos
export type LotInput = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  salesStart?: Date | null;
  salesEnd?: Date | null;
};

export type SectorInput = { id?: number; name: string; lots: LotInput[] };

export type CreateEventInput = {
  name: string;
  subtitle?: string | null;
  description: string;
  categoryId: number;
  startDateTime: Date | string;
  endDateTime?: Date | string | null;
  location: string;
  sectors: SectorInput[];
};

// Sem `sectors`, mantém os setores atuais; com, substitui a lista inteira
export type UpdateEventInput = Partial<Omit<CreateEventInput, 'sectors'>> & {
  sectors?: SectorInput[];
};

export type EventListQuery = {
  name?: string;
  active?: string;
  category_id?: number;
  start_date?: Date;
  sort?: EventSort;
  skip?: number;
  take?: number;
};
