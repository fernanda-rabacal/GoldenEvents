import { mock, type MockProxy } from 'jest-mock-extended';
import { UserTypeEnum } from '@golden-events/shared';
import { OrganizerSalesService } from './organizer-sales.service.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { BillingService } from '../../billing/index.js';
import { TicketInventoryService } from '../../event/ticket-inventory.service.js';
import { ForbiddenError } from '../../common/errors/types/ForbiddenError.js';
import { UserService } from '../../user/user.service.js';

const ORGANIZER = { id: 1, user_type_id: UserTypeEnum.ORGANIZER };
const BUYER = { id: 9, user_type_id: UserTypeEnum.USER };

const ORDER = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  buyer_id: 9,
  event_id: 10,
  status: 'paid',
  subtotal_cents: 10000,
  discount_cents: 0,
  total_cents: 10000,
  platform_fee_cents: 1000,
  currency: 'BRL',
  expires_at: new Date(),
  paid_at: new Date(),
  paid_charge_id: 'charge-1',
  created_at: new Date(),
  updated_at: new Date(),
  items: [
    {
      id: 'item-1',
      order_id: 'a1b2c3d4-0000-4000-8000-000000000001',
      lot_id: 5,
      quantity: 2,
      unit_price_cents: 5000,
      tickets: [],
    },
  ],
};

describe('OrganizerSalesService', () => {
  let service: OrganizerSalesService;
  let repository: MockProxy<OrdersRepository>;
  let inventory: MockProxy<TicketInventoryService>;
  let billing: MockProxy<BillingService>;
  let users: MockProxy<UserService>;

  beforeEach(() => {
    repository = mock<OrdersRepository>();
    inventory = mock<TicketInventoryService>();
    billing = mock<BillingService>();
    users = mock<UserService>();
    service = new OrganizerSalesService(repository, inventory, billing, users);

    inventory.findOrganizerEvents.mockResolvedValue([
      { id: 10, name: 'Festival de Verão' },
      { id: 11, name: 'Design & Coffee' },
    ]);
  });

  it('rejects a buyer account', async () => {
    await expect(service.listOrders(BUYER, {})).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.findPageForEvents).not.toHaveBeenCalled();
  });

  it('rejects an event from another organizer', async () => {
    await expect(service.summarize(ORGANIZER, { event_id: 99 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.summarizeForEvents).not.toHaveBeenCalled();
  });

  it('lists orders from all of the organizer events, with buyer, lot and payment method', async () => {
    repository.findPageForEvents.mockResolvedValue([1, [ORDER]] as never);
    users.findContacts.mockResolvedValue([
      { id: 9, name: 'Mariana Oliveira', email: 'mariana@email.com' },
    ]);
    inventory.findLotLabels.mockResolvedValue([
      { id: 5, name: '1º lote', sector: { name: 'Pista' } },
    ]);
    billing.findMethodsByChargeIds.mockResolvedValue(new Map([['charge-1', 'pix']]));

    const page = await service.listOrders(ORGANIZER, { skip: 0, take: 10 });

    expect(repository.findPageForEvents).toHaveBeenCalledWith(
      expect.objectContaining({ eventIds: [10, 11], buyerIds: undefined }),
      0,
      10,
    );
    expect(page.totalFiltered).toBe(1);
    expect(page.content[0]).toMatchObject({
      event: { id: 10, name: 'Festival de Verão' },
      buyer: { name: 'Mariana Oliveira', email: 'mariana@email.com' },
      method: 'pix',
      ticket_count: 2,
      items: [{ lot_name: '1º lote', sector_name: 'Pista', quantity: 2 }],
    });
  });

  it('returns an empty page without querying orders when no buyer matches the search', async () => {
    users.findIdsMatching.mockResolvedValue([]);

    const page = await service.listOrders(ORGANIZER, { search: 'ninguém' });

    expect(page.content).toEqual([]);
    expect(repository.findPageForEvents).not.toHaveBeenCalled();
  });

  it('filters the orders by a single buyer, for the audience history', async () => {
    repository.findPageForEvents.mockResolvedValue([0, []] as never);

    await service.listOrders(ORGANIZER, { buyer_id: 9, search: 'ignorado' });

    expect(users.findIdsMatching).not.toHaveBeenCalled();
    expect(repository.findPageForEvents).toHaveBeenCalledWith(
      expect.objectContaining({ buyerIds: [9] }),
      0,
      10,
    );
  });

  it('rejects a buyer account from the audience', async () => {
    await expect(service.listAudience(BUYER, {})).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.findAudiencePage).not.toHaveBeenCalled();
  });

  it('lists the audience with contacts and ticket check-ins', async () => {
    const paidAt = new Date('2026-09-01T12:00:00.000Z');

    repository.findAudiencePage.mockResolvedValue({
      total: 1,
      members: [
        {
          buyer_id: 9,
          orders_count: 3,
          events_count: 2,
          total_cents: 25000,
          first_purchase_at: paidAt,
          last_purchase_at: paidAt,
        },
      ],
    });
    repository.countTicketsByBuyer.mockResolvedValue(
      new Map([[9, { tickets: 4, used: 1 }]]),
    );
    users.findContacts.mockResolvedValue([
      { id: 9, name: 'Mariana Oliveira', email: 'mariana@email.com' },
    ]);

    const page = await service.listAudience(ORGANIZER, {
      segment: 'returning',
      sort: 'spent',
      skip: 1,
      take: 10,
    });

    expect(repository.findAudiencePage).toHaveBeenCalledWith(
      expect.objectContaining({ eventIds: [10, 11], segment: 'returning' }),
      'spent',
      10,
      10,
    );
    expect(page.totalFiltered).toBe(1);
    expect(page.content[0]).toEqual({
      buyer: { id: 9, name: 'Mariana Oliveira', email: 'mariana@email.com' },
      events_count: 2,
      orders_count: 3,
      tickets_count: 4,
      tickets_used: 1,
      total_cents: 25000,
      first_purchase_at: paidAt.toISOString(),
      last_purchase_at: paidAt.toISOString(),
    });
  });

  it('returns an empty audience without querying when no buyer matches the search', async () => {
    users.findIdsMatching.mockResolvedValue([]);

    const page = await service.listAudience(ORGANIZER, { search: 'ninguém' });

    expect(page.content).toEqual([]);
    expect(repository.findAudiencePage).not.toHaveBeenCalled();
  });

  it('summarizes the audience with the average spent per person', async () => {
    repository.summarizeAudience.mockResolvedValue({
      buyers: 4,
      returningBuyers: 1,
      newBuyers: 2,
      totalCents: 30000,
    });

    await expect(service.summarizeAudience(ORGANIZER, { event_id: 11 })).resolves.toEqual(
      {
        buyers: 4,
        returningBuyers: 1,
        newBuyers: 2,
        averageSpentCents: 7500,
      },
    );
    expect(repository.summarizeAudience).toHaveBeenCalledWith(
      expect.objectContaining({ eventIds: [11] }),
    );
  });

  it('summarizes net revenue and the average order', async () => {
    repository.summarizeForEvents.mockResolvedValue({
      paidOrders: 3,
      totalCents: 30000,
      feeCents: 3000,
      ticketsSold: 5,
      refundedOrders: 1,
    });

    await expect(service.summarize(ORGANIZER, { event_id: 10 })).resolves.toEqual({
      grossRevenue: 30000,
      netRevenue: 27000,
      paidOrders: 3,
      ticketsSold: 5,
      averageOrder: 10000,
      refundedOrders: 1,
    });
    expect(repository.summarizeForEvents).toHaveBeenCalledWith([10], undefined);
  });
});
