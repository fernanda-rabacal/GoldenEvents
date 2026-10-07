import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  ChartColumn,
  CircleHelp,
  Plus,
  Ticket,
  UsersRound,
} from 'lucide-react';
import {
  METRICS_PERIOD_OPTIONS,
  type MetricWithChange,
  type MetricsPeriod,
} from '@golden-events/shared';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { MetricCard } from '@/components/admin/MetricCard';
import { OrdersHistory } from '@/components/admin/OrdersHistory';
import { SalesChart } from '@/components/admin/SalesChart';
import { SalesPeriodSelect } from '@/components/admin/SalesPeriodSelect';
import {
  CREATE_EVENT_PATH,
  ORGANIZER_PATH,
} from '@/components/layout/nav-links';
import { cn } from '@/lib/utils';
import { requireOrganizer } from '@/services/auth';
import { getMyMetrics } from '@/services/events';
import { buttonVariants } from '@/ui/button';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';
import { formatWholeMoney } from '@/utils/format_money';

export const metadata: Metadata = {
  title: 'Visão geral',
};

const CHANGE_DESCRIPTION = 'em relação aos 30 dias anteriores';

type OrganizerDashboardPageProps = {
  searchParams: Promise<{ periodo?: SearchParamValue }>;
};

function parsePeriod(value?: string): MetricsPeriod {
  const period = Number(value) as MetricsPeriod;

  return METRICS_PERIOD_OPTIONS.includes(period) ? period : 7;
}

function changeBadge({ change }: MetricWithChange) {
  if (change === null) {
    return undefined;
  }

  const formatted = change.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return {
    text: `${change > 0 ? '+' : ''}${formatted}%`,
    tone:
      change > 0
        ? ('positive' as const)
        : change < 0
          ? ('negative' as const)
          : ('neutral' as const),
    description: CHANGE_DESCRIPTION,
  };
}

export default async function OrganizerDashboardPage({
  searchParams,
}: OrganizerDashboardPageProps) {
  const user = await requireOrganizer(ORGANIZER_PATH);
  const period = parsePeriod(firstValue((await searchParams).periodo));
  const metrics = await getMyMetrics(period);
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <AdminPageHeading
        eyebrow='Painel de controle'
        title={`Olá, ${firstName}.`}
        description='Acompanhe o desempenho dos seus eventos em um só lugar.'
        actions={
          <Link
            href={CREATE_EVENT_PATH}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/20',
            )}
          >
            <Plus data-icon='inline-start' /> Criar evento
          </Link>
        }
      />

      {!metrics ? (
        <p className='rounded-xl border border-border bg-card p-10 text-center text-body text-destructive'>
          Não foi possível carregar as métricas.
        </p>
      ) : (
        <>
          <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              label='Ingressos vendidos'
              value={metrics.ticketsSold.total.toLocaleString('pt-BR')}
              icon={Ticket}
              badge={changeBadge(metrics.ticketsSold)}
            />
            <MetricCard
              label='Receita total'
              value={formatWholeMoney(metrics.revenue.total)}
              icon={ChartColumn}
              badge={changeBadge(metrics.revenue)}
            />
            <MetricCard
              label='Eventos ativos'
              value={String(metrics.activeEvents.total).padStart(2, '0')}
              icon={CalendarDays}
              badge={
                metrics.activeEvents.createdThisMonth > 0
                  ? {
                      text: `+${metrics.activeEvents.createdThisMonth} este mês`,
                      tone: 'positive',
                      description: 'eventos criados este mês',
                    }
                  : undefined
              }
            />
            <MetricCard
              label='Público alcançado'
              value={metrics.audience.total.toLocaleString('pt-BR')}
              icon={UsersRound}
              badge={changeBadge(metrics.audience)}
            />
          </div>

          <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
            <section className='rounded-xl border border-border bg-card p-6'>
              <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <h2 className='text-h4 text-foreground'>
                    Desempenho de vendas
                  </h2>
                  <p className='mt-1 text-body-sm text-muted-foreground'>
                    Ingressos vendidos nos últimos {period} dias
                  </p>
                </div>
                <SalesPeriodSelect value={period} />
              </div>
              <SalesChart data={metrics.dailySales} />
            </section>

            <section className='flex flex-col rounded-xl bg-primary p-8 text-primary-foreground'>
              <span className='flex size-11 items-center justify-center rounded-xl bg-white/15'>
                <CircleHelp className='size-6' />
              </span>
              <h2 className='mt-auto pt-10 text-h3'>Precisa de ajuda?</h2>
              <p className='mt-3 text-body-sm leading-6 text-white/80'>
                Veja dicas para vender mais ingressos e criar experiências
                incríveis para o seu público.
              </p>
              <Link
                href='/#sobre'
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'lg' }),
                  'mt-6 h-11 self-start rounded-xl px-5 font-bold',
                )}
              >
                Acessar central de ajuda
              </Link>
            </section>
          </div>
        </>
      )}

      <div className='mt-6'>
        <OrdersHistory />
      </div>
    </>
  );
}
