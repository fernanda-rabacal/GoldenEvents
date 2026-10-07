import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, Ticket } from 'lucide-react';
import { MY_TICKETS_PATH } from '@/components/layout/nav-links';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketsSummary } from '@/components/tickets/TicketsSummary';
import { cn } from '@/lib/utils';
import { requireUser } from '@/services/auth';
import { getMyTickets, type EventTickets } from '@/services/users';
import { buttonVariants } from '@/ui/button';
import { EVENTS_PAGE_PATH } from '@/utils/events_href';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';
import { hasEventEnded } from '@/utils/tickets';

export const metadata: Metadata = {
  title: 'Meus ingressos',
};

type MyTicketsPageProps = {
  searchParams: Promise<{ busca?: SearchParamValue }>;
};

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function sortByDate(groups: EventTickets[]) {
  const upcoming = groups.filter(({ event }) => !hasEventEnded(event));
  const ended = groups.filter(({ event }) => hasEventEnded(event));
  const byStart = (a: EventTickets, b: EventTickets) =>
    a.event.start_date.localeCompare(b.event.start_date);

  return [...upcoming.sort(byStart), ...ended.sort(byStart).reverse()];
}

export default async function MyTicketsPage({
  searchParams,
}: MyTicketsPageProps) {
  await requireUser(MY_TICKETS_PATH);
  const query = firstValue((await searchParams).busca)?.trim() ?? '';
  const groups = await getMyTickets();
  const visibleGroups = sortByDate(
    (groups ?? []).filter(({ event }) =>
      normalize(event.name).includes(normalize(query)),
    ),
  );

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <Link
        href={EVENTS_PAGE_PATH}
        className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
      >
        <ArrowLeft className='size-4' /> Voltar para eventos
      </Link>

      <div className='mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
            Minha conta
          </p>
          <h1 className='mt-2 text-h2 text-foreground sm:text-h1'>
            Meus ingressos
          </h1>
          <p className='mt-2 text-body text-muted-foreground'>
            Acesse seus ingressos e prepare-se para viver novas experiências.
          </p>
        </div>

        {Boolean(groups?.length) && (
          <form
            action={MY_TICKETS_PATH}
            method='get'
            role='search'
            className='relative w-full sm:max-w-xs'
          >
            <Search className='absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/70' />
            <input
              type='search'
              name='busca'
              defaultValue={query}
              aria-label='Buscar ingresso'
              placeholder='Buscar ingresso'
              className='w-full rounded-xl border border-border bg-card py-3 pr-4 pl-11 text-body-sm text-foreground transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/40'
            />
          </form>
        )}
      </div>

      {!groups && (
        <p className='mt-8 text-body text-destructive'>
          Não foi possível carregar seus ingressos. Tente novamente em alguns
          instantes.
        </p>
      )}

      {groups && (
        <div className='mt-8'>
          <TicketsSummary groups={groups} />
        </div>
      )}

      {groups?.length === 0 && (
        <div className='mt-6 rounded-xl border border-dashed border-input bg-card px-6 py-16 text-center'>
          <Ticket className='mx-auto size-8 text-orange-500' />
          <h2 className='mt-4 text-h4 text-foreground'>
            Você ainda não tem ingressos
          </h2>
          <p className='mt-2 text-body-sm text-muted-foreground'>
            Quando comprar um ingresso, ele aparece aqui com o QR code para a
            entrada.
          </p>
          <Link
            href={EVENTS_PAGE_PATH}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}
          >
            Encontrar eventos
          </Link>
        </div>
      )}

      {Boolean(groups?.length) && visibleGroups.length === 0 && (
        <div className='mt-6 rounded-xl border border-dashed border-input bg-card px-6 py-16 text-center'>
          <Search className='mx-auto size-8 text-orange-500' />
          <h2 className='mt-4 text-h4 text-foreground'>
            Nenhum ingresso para “{query}”
          </h2>
          <Link
            href={MY_TICKETS_PATH}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}
          >
            Limpar busca
          </Link>
        </div>
      )}

      {visibleGroups.length > 0 && (
        <div className='mt-6 flex flex-col gap-4'>
          {visibleGroups.map((group) => (
            <TicketCard key={group.event.id} group={group} />
          ))}
        </div>
      )}
    </main>
  );
}
