import { mock, type MockProxy } from 'jest-mock-extended';
import { UserTypeEnum } from '@golden-events/shared';
import { OrganizerMetricsService } from './organizer-metrics.service.js';
import { TicketsRepository } from '../infra/tickets.repository.js';
import { TicketInventoryService } from '../../event/index.js';
import { ForbiddenError } from '../../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../../common/errors/types/NotFoundError.js';

const ORGANIZER = { id: 1, user_type_id: UserTypeEnum.ORGANIZER };
const BUYER = { id: 9, user_type_id: UserTypeEnum.USER };

function lot(id: number, quantity: number, quantityLeft: number) {
  return {
    id,
    sector_id: 1,
    name: `Lote ${id}`,
    price: 4500,
    quantity,
    quantity_left: quantityLeft,
    position: id,
    sales_start: null,
    sales_end: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('OrganizerMetricsService', () => {
  let service: OrganizerMetricsService;
  let repository: MockProxy<TicketsRepository>;
  let inventory: MockProxy<TicketInventoryService>;

  beforeEach(() => {
    repository = mock<TicketsRepository>();
    inventory = mock<TicketInventoryService>();
    service = new OrganizerMetricsService(repository, inventory);
  });

  it('should only show the metrics to organizers', async () => {
    await expect(service.metrics(BUYER, 7)).rejects.toBeInstanceOf(ForbiddenError);
    expect(inventory.findOrganizerEvents).not.toHaveBeenCalled();
  });

  it('should count only the tickets of the organizer events', async () => {
    inventory.findOrganizerEvents.mockResolvedValue([
      { id: 10, name: 'Festival de Verão' },
      { id: 11, name: 'Design & Coffee' },
    ]);
    repository.summarizeForEvents
      .mockResolvedValueOnce({ tickets: 12, revenue: 60000, audience: 3 })
      .mockResolvedValueOnce({ tickets: 6, revenue: 30000, audience: 1 })
      .mockResolvedValueOnce({ tickets: 4, revenue: 0, audience: 2 });
    repository.findDatesForEvents.mockResolvedValue([new Date(), new Date()]);
    inventory.countActiveEvents.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const metrics = await service.metrics(ORGANIZER, 7);

    expect(inventory.findOrganizerEvents).toHaveBeenCalledWith(ORGANIZER.id);
    expect(repository.summarizeForEvents).toHaveBeenNthCalledWith(1, [10, 11]);
    expect(repository.findDatesForEvents).toHaveBeenCalledWith(
      [10, 11],
      expect.any(Date),
    );
    expect(metrics.ticketsSold).toStrictEqual({ total: 12, change: 50 });
    expect(metrics.activeEvents).toStrictEqual({ total: 5, createdThisMonth: 2 });
    expect(metrics.dailySales).toHaveLength(7);
    expect(metrics.dailySales.at(-1).tickets).toBe(2);
  });

  it('should show the lot sales of the organizer event', async () => {
    inventory.findEvent.mockResolvedValue({
      user_id: ORGANIZER.id,
      sectors: [{ id: 1, name: 'Pista', lots: [lot(5, 10, 7)] }],
    } as never);
    repository.summarizeByLot.mockResolvedValue([{ lotId: 5, sold: 2, revenue: 9000 }]);

    const [sector] = await service.lotSales(ORGANIZER, 10);

    expect(repository.summarizeByLot).toHaveBeenCalledWith(10);
    expect(sector.lots[0]).toMatchObject({ sold: 2, reserved: 1, revenue: 9000 });
  });

  it('should hide the lot sales of an event from another organizer or that does not exist', async () => {
    inventory.findEvent.mockResolvedValueOnce({ user_id: 2, sectors: [] } as never);
    await expect(service.lotSales(ORGANIZER, 10)).rejects.toBeInstanceOf(ForbiddenError);

    inventory.findEvent.mockResolvedValueOnce(null);
    await expect(service.lotSales(ORGANIZER, 10)).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.summarizeByLot).not.toHaveBeenCalled();
  });
});
