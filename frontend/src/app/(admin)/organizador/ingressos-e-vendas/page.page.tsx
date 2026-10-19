import type { Metadata } from 'next';
import { ChartColumn, ReceiptText, Ticket, Wallet } from 'lucide-react';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { ExportOrdersButton } from '@/components/admin/ExportOrdersButton';
import { LotSalesList } from '@/components/admin/LotSalesList';
import { MetricCard } from '@/components/admin/MetricCard';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { SalesFilters } from '@/components/admin/SalesFilters';
import { SalesTabs } from '@/components/admin/SalesTabs';
import { TablePagination } from '@/components/admin/TablePagination';
import { TICKET_SALES_PATH } from '@/components/layout/nav-links';
import { requireOrganizer } from '@/services/auth';
import { getEventLotSales, getMyEvents } from '@/services/events';
import {
  getOrganizerOrders,
  getOrganizerSalesSummary,
} from '@/services/orders';
import { formatMoney, formatWholeMoney } from '@/utils/format_money';
import {
  buildSalesHref,
  parseSalesSearchParams,
  type SalesSearchParams,
} from '@/utils/sales_search_params';

export const metadata: Metadata = {
  title: 'Ingressos e vendas',
};

const ORDERS_PER_PAGE = 10;
// O seletor lista todos os eventos do organizador; a API limita a página a 100
const EVENTS_IN_SELECT = 100;

type TicketSalesPageProps = {
  searchParams: Promise<SalesSearchParams>;
};

export default async function TicketSalesPage({
  searchParams,
}: TicketSalesPageProps) {
  await requireOrganizer(TICKET_SALES_PATH);

  const params = await searchParams;
  const { tab, eventId, days, search, status, page } =
    parseSalesSearchParams(params);
  const showOrders = tab === 'vendas';

  const [events, summary, orders, lotSales] = await Promise.all([
    getMyEvents({ page: 1, take: EVENTS_IN_SELECT }),
    getOrganizerSalesSummary({ eventId, days }),
    showOrders
      ? getOrganizerOrders({
          eventId,
          days,
          search,
          status,
          page,
          take: ORDERS_PER_PAGE,
        })
      : null,
    !showOrders && eventId ? getEventLotSales(eventId) : null,
  ]);

  const selectedEvent = events.content.find(({ id }) => Number(id) === eventId);
  const periodDescription = days
    ? `nos últimos ${days} dias`
    : 'desde o início das vendas';

  return (
    <>
      <AdminPageHeading
        title='Ingressos e vendas'
        description='Acompanhe os pedidos e o desempenho de cada lote dos seus eventos.'
      />

      <SalesFilters
        events={events.content.map(({ id, name }) => ({
          id: Number(id),
          name,
        }))}
        showOrderFilters={showOrders}
      />

      <div className='mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Receita líquida'
          value={formatWholeMoney(summary.netRevenue)}
          icon={Wallet}
          badge={{
            text: `${formatWholeMoney(summary.grossRevenue)} bruto`,
            tone: 'neutral',
            description: `vendido ${periodDescription}, antes da taxa da plataforma`,
          }}
        />
        <MetricCard
          label='Ingressos vendidos'
          value={summary.ticketsSold.toLocaleString('pt-BR')}
          icon={Ticket}
          badge={
            selectedEvent && selectedEvent.capacity > 0
              ? {
                  text: `de ${selectedEvent.capacity.toLocaleString('pt-BR')}`,
                  tone: 'neutral',
                  description: 'da capacidade do evento',
                }
              : undefined
          }
        />
        <MetricCard
          label='Pedidos pagos'
          value={summary.paidOrders.toLocaleString('pt-BR')}
          icon={ReceiptText}
          badge={
            summary.refundedOrders > 0
              ? {
                  text: `${summary.refundedOrders} reembolsado${summary.refundedOrders === 1 ? '' : 's'}`,
                  tone: 'negative',
                  description: `pedidos pagos ${periodDescription} e depois reembolsados`,
                }
              : undefined
          }
        />
        <MetricCard
          label='Ticket médio'
          value={formatMoney(summary.averageOrder)}
          icon={ChartColumn}
        />
      </div>

      <SalesTabs
        current={tab}
        buildHref={(target) =>
          buildSalesHref(TICKET_SALES_PATH, params, { tab: target })
        }
      />

      {orders && (
        <section aria-label='Pedidos'>
          {orders.content.length === 0 ? (
            <p className='rounded-xl border border-dashed border-input bg-card p-10 text-center text-body text-muted-foreground'>
              Nenhum pedido encontrado.
            </p>
          ) : (
            <div className='rounded-xl border border-border bg-card p-5'>
              <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
                <p className='text-body-sm text-muted-foreground'>
                  {orders.totalFiltered.toLocaleString('pt-BR')}{' '}
                  {orders.totalFiltered === 1 ? 'pedido' : 'pedidos'}
                </p>
                <ExportOrdersButton orders={orders.content} />
              </div>
              <OrdersTable orders={orders.content} showEvent={!eventId} />
            </div>
          )}

          <TablePagination
            page={page}
            totalPages={orders.totalPages}
            buildHref={(target) =>
              buildSalesHref(TICKET_SALES_PATH, params, {
                page: String(target),
              })
            }
          />
        </section>
      )}

      {!showOrders &&
        (lotSales ? (
          <section aria-label='Vendas por lote'>
            <p className='mb-4 text-body-sm text-muted-foreground'>
              Totais desde o início das vendas. Reservados são ingressos em
              pedidos aguardando pagamento.
            </p>
            <LotSalesList sectors={lotSales} />
          </section>
        ) : (
          <p className='rounded-xl border border-dashed border-input bg-card p-10 text-center text-body text-muted-foreground'>
            Escolha um evento no filtro acima para ver as vendas de cada lote.
          </p>
        ))}
    </>
  );
}
