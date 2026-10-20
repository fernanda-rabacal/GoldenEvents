import { mock, type MockProxy } from 'jest-mock-extended';
import { TicketsService } from './tickets.service.js';
import { TicketsRepository } from '../infra/tickets.repository.js';
import { TicketInventoryService } from '../../event/index.js';

function ticket(id: number, eventId: number, lotId = 5) {
  return {
    id,
    event_id: eventId,
    lot_id: lotId,
    code: `code-${id}`,
    status: 'valid' as const,
    used_at: null,
    created_at: new Date(),
  };
}

function eventSummary(id: number) {
  return {
    id,
    name: `Evento ${id}`,
    slug: `evento-${id}`,
    photo: 'foto.png',
    start_date: new Date(),
    end_date: null,
    location: 'Parque da Cidade',
    category: { name: 'Shows' },
  };
}

describe('TicketsService', () => {
  let service: TicketsService;
  let repository: MockProxy<TicketsRepository>;
  let inventory: MockProxy<TicketInventoryService>;

  beforeEach(() => {
    repository = mock<TicketsRepository>();
    inventory = mock<TicketInventoryService>();
    service = new TicketsService(repository, inventory);
  });

  it('should group the buyer tickets by event, with the lot and sector names', async () => {
    repository.findByBuyer.mockResolvedValue([
      ticket(1, 10),
      ticket(2, 20, 6),
      ticket(3, 10),
    ]);
    inventory.findEventSummaries.mockResolvedValue([eventSummary(20), eventSummary(10)]);
    inventory.findLotLabels.mockResolvedValue([
      { id: 5, name: '1º lote', sector: { name: 'Pista' } },
      { id: 6, name: 'Lote único', sector: { name: 'Camarote' } },
    ]);

    const groups = await service.findMine(9);

    expect(repository.findByBuyer).toHaveBeenCalledWith(9);
    expect(inventory.findEventSummaries).toHaveBeenCalledWith([10, 20]);
    expect(inventory.findLotLabels).toHaveBeenCalledWith([5, 6]);
    expect(groups.map(({ event, quantity }) => [event.id, quantity])).toEqual([
      [10, 2],
      [20, 1],
    ]);
    expect(groups[0].tickets).toEqual([
      {
        id: 1,
        code: 'code-1',
        status: 'valid',
        used_at: null,
        created_at: expect.any(Date),
        lot: { name: '1º lote', sector: { name: 'Pista' } },
      },
      expect.objectContaining({ id: 3 }),
    ]);
    expect(groups[1].tickets[0].lot).toEqual({
      name: 'Lote único',
      sector: { name: 'Camarote' },
    });
  });

  it('should not look up events for a buyer without tickets', async () => {
    repository.findByBuyer.mockResolvedValue([]);

    await expect(service.findMine(9)).resolves.toEqual([]);
    expect(inventory.findEventSummaries).not.toHaveBeenCalled();
  });
});
