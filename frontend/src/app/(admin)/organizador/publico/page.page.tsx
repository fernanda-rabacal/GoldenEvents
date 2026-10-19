import type { Metadata } from 'next';
import { Repeat, Sparkles, UsersRound, Wallet } from 'lucide-react';
import { NEW_BUYER_WINDOW_DAYS } from '@golden-events/shared';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { AudienceFilters } from '@/components/admin/AudienceFilters';
import { AudienceTable } from '@/components/admin/AudienceTable';
import { ExportAudienceButton } from '@/components/admin/ExportAudienceButton';
import { MetricCard } from '@/components/admin/MetricCard';
import { TablePagination } from '@/components/admin/TablePagination';
import { AUDIENCE_PATH } from '@/components/layout/nav-links';
import { requireOrganizer } from '@/services/auth';
import { getMyEvents } from '@/services/events';
import {
  getOrganizerAudience,
  getOrganizerAudienceSummary,
} from '@/services/orders';
import { formatMoney } from '@/utils/format_money';
import {
  buildAudienceHref,
  parseAudienceSearchParams,
  type AudienceSearchParams,
} from '@/utils/audience_search_params';

export const metadata: Metadata = {
  title: 'Público',
};

const MEMBERS_PER_PAGE = 10;
// O seletor lista todos os eventos do organizador; a API limita a página a 100
const EVENTS_IN_SELECT = 100;

type AudiencePageProps = {
  searchParams: Promise<AudienceSearchParams>;
};

export default async function AudiencePage({
  searchParams,
}: AudiencePageProps) {
  await requireOrganizer(AUDIENCE_PATH);

  const params = await searchParams;
  const { eventId, search, segment, sort, page } =
    parseAudienceSearchParams(params);

  const [events, summary, audience] = await Promise.all([
    getMyEvents({ page: 1, take: EVENTS_IN_SELECT }),
    getOrganizerAudienceSummary(eventId),
    getOrganizerAudience({
      eventId,
      search,
      segment,
      sort,
      page,
      take: MEMBERS_PER_PAGE,
    }),
  ]);

  const returningShare =
    summary.buyers > 0
      ? Math.round((summary.returningBuyers / summary.buyers) * 100)
      : 0;

  return (
    <>
      <AdminPageHeading
        title='Público'
        description='Conheça quem compra ingressos para os seus eventos.'
      />

      <AudienceFilters
        events={events.content.map(({ id, name }) => ({
          id: Number(id),
          name,
        }))}
      />

      <div className='mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Público total'
          value={summary.buyers.toLocaleString('pt-BR')}
          icon={UsersRound}
        />
        <MetricCard
          label='Recorrentes'
          value={summary.returningBuyers.toLocaleString('pt-BR')}
          icon={Repeat}
          badge={
            summary.buyers > 0
              ? {
                  text: `${returningShare}%`,
                  tone: 'neutral',
                  description: 'do público comprou para mais de um evento',
                }
              : undefined
          }
        />
        <MetricCard
          label={`Novos em ${NEW_BUYER_WINDOW_DAYS} dias`}
          value={summary.newBuyers.toLocaleString('pt-BR')}
          icon={Sparkles}
        />
        <MetricCard
          label='Gasto médio por pessoa'
          value={formatMoney(summary.averageSpentCents)}
          icon={Wallet}
        />
      </div>

      <section aria-label='Público'>
        {audience.content.length === 0 ? (
          <p className='rounded-xl border border-dashed border-input bg-card p-10 text-center text-body text-muted-foreground'>
            {search || segment
              ? 'Ninguém encontrado com esses filtros.'
              : 'Quando alguém comprar ingressos para os seus eventos, vai aparecer aqui.'}
          </p>
        ) : (
          <div className='rounded-xl border border-border bg-card p-5'>
            <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
              <p className='text-body-sm text-muted-foreground'>
                {audience.totalFiltered.toLocaleString('pt-BR')}{' '}
                {audience.totalFiltered === 1 ? 'pessoa' : 'pessoas'}
              </p>
              <ExportAudienceButton
                eventId={eventId}
                search={search}
                segment={segment}
                disabled={audience.totalFiltered === 0}
              />
            </div>
            <AudienceTable members={audience.content} />
          </div>
        )}

        <TablePagination
          page={page}
          totalPages={audience.totalPages}
          buildHref={(target) =>
            buildAudienceHref(AUDIENCE_PATH, params, {
              page: String(target),
            })
          }
        />
      </section>
    </>
  );
}
