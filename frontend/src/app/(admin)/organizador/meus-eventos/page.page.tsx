import type { Metadata } from 'next';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Eye, Pencil, Plus } from 'lucide-react';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { MyEventsFilters } from '@/components/admin/MyEventsFilters';
import { TablePagination } from '@/components/admin/TablePagination';
import {
  CREATE_EVENT_PATH,
  MY_EVENTS_PATH,
  buildEditEventHref,
} from '@/components/layout/nav-links';
import { cn } from '@/lib/utils';
import { requireOrganizer } from '@/services/auth';
import { getEventCategories, getMyEvents } from '@/services/events';
import { Button, buttonVariants } from '@/ui/button';
import { buildEventHref } from '@/utils/events_href';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';
import { formatDateTime } from '@/utils/format_date';

export const metadata: Metadata = {
  title: 'Meus eventos',
};

const EVENTS_PER_PAGE = 10;

type MyEventsPageProps = {
  searchParams: Promise<{
    nome?: SearchParamValue;
    categoria?: SearchParamValue;
    ativo?: SearchParamValue;
    data?: SearchParamValue;
    pagina?: SearchParamValue;
  }>;
};

export default async function MyEventsPage({
  searchParams,
}: MyEventsPageProps) {
  await requireOrganizer(MY_EVENTS_PATH);

  const params = await searchParams;
  const active = firstValue(params.ativo);
  const page = Math.max(1, Number(firstValue(params.pagina)) || 1);

  const [result, categories] = await Promise.all([
    getMyEvents({
      name: firstValue(params.nome)?.trim(),
      categoryId: Number(firstValue(params.categoria)) || undefined,
      active: active === '0' || active === '1' ? active : undefined,
      startDate: firstValue(params.data),
      page,
      take: EVENTS_PER_PAGE,
    }),
    getEventCategories(),
  ]);

  const events = result?.content ?? [];

  function buildPageHref(targetPage: number) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      const paramValue = firstValue(value);

      if (paramValue && key !== 'pagina') {
        query.set(key, paramValue);
      }
    }

    query.set('pagina', String(targetPage));

    return `${MY_EVENTS_PATH}?${query}`;
  }

  return (
    <>
      <AdminPageHeading
        title='Meus eventos'
        description='Eventos que você criou na Golden.'
        actions={
          <Link
            href={CREATE_EVENT_PATH}
            className={buttonVariants({ size: 'lg' })}
          >
            <Plus data-icon='inline-start' /> Criar evento
          </Link>
        }
      />

      <MyEventsFilters categories={categories} />

      {!result ? (
        <p className='rounded-xl border border-border bg-card p-10 text-center text-body text-destructive'>
          Não foi possível carregar os eventos.
        </p>
      ) : events.length === 0 ? (
        <p className='rounded-xl border border-dashed border-input bg-card p-10 text-center text-body text-muted-foreground'>
          Nenhum evento encontrado.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-border bg-card'>
          <table className='w-full text-left text-body-sm'>
            <thead className='border-b border-border text-muted-foreground'>
              <tr>
                <th className='px-5 py-4 font-bold'>ID</th>
                <th className='px-5 py-4 font-bold'>Nome</th>
                <th className='px-5 py-4 font-bold'>Categoria</th>
                <th className='px-5 py-4 font-bold'>Capacidade</th>
                <th className='px-5 py-4 font-bold'>Início</th>
                <th className='px-5 py-4 font-bold'>Criado em</th>
                <th className='px-5 py-4 font-bold'>Ativo</th>
                <th className='px-5 py-4'>
                  <span className='sr-only'>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const hasHappened = dayjs(event.start_date).isBefore(dayjs());

                return (
                  <tr
                    key={event.id}
                    className='border-b border-border last:border-0'
                  >
                    <td className='px-5 py-4 text-muted-foreground'>
                      {event.id}
                    </td>
                    <td className='px-5 py-4 font-bold text-foreground'>
                      {event.name}
                    </td>
                    <td className='px-5 py-4'>{event.category?.name}</td>
                    <td className='px-5 py-4'>{event.capacity}</td>
                    <td className='px-5 py-4 whitespace-nowrap'>
                      {formatDateTime(event.start_date)}
                    </td>
                    <td className='px-5 py-4 whitespace-nowrap'>
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className='px-5 py-4'>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-caption font-bold',
                          event.active
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {event.active ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className='px-5 py-4'>
                      <div className='flex justify-end gap-1'>
                        <Link
                          href={buildEventHref(event.slug)}
                          aria-label={`Ver a página de ${event.name}`}
                          className={buttonVariants({
                            variant: 'ghost',
                            size: 'icon',
                          })}
                        >
                          <Eye />
                        </Link>
                        {hasHappened ? (
                          <Button
                            variant='ghost'
                            size='icon'
                            disabled
                            title='Eventos que já aconteceram não podem ser editados'
                            aria-label={`${event.name} já aconteceu e não pode ser editado`}
                          >
                            <Pencil />
                          </Button>
                        ) : (
                          <Link
                            href={buildEditEventHref(event.slug)}
                            aria-label={`Editar ${event.name}`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'icon',
                            })}
                          >
                            <Pencil />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={result?.totalPages ?? 0}
        buildHref={buildPageHref}
      />
    </>
  );
}
