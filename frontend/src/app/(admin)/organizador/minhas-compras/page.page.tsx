import type { Metadata } from 'next';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { TablePagination } from '@/components/admin/TablePagination';
import { MY_TICKETS_PATH } from '@/components/layout/nav-links';
import { requireUser } from '@/services/auth';
import { getUserTickets } from '@/services/users';
import { Button } from '@/ui/button';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';
import { formatDate } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';

export const metadata: Metadata = {
  title: 'Minhas compras',
};

const TICKETS_PER_PAGE = 10;

type MyTicketsPageProps = {
  searchParams: Promise<{ pagina?: SearchParamValue }>;
};

// Migrada como estava no Pages Router: o fluxo de compra e esta página ainda serão redesenhados
export default async function MyTicketsPage({
  searchParams,
}: MyTicketsPageProps) {
  const user = await requireUser(MY_TICKETS_PATH);
  const page = Math.max(
    1,
    Number(firstValue((await searchParams).pagina)) || 1,
  );
  const data = await getUserTickets(user.id, page, TICKETS_PER_PAGE);

  return (
    <>
      <AdminPageHeading title='Minhas compras' />

      {!data && (
        <p className='mb-6 text-body text-destructive'>
          Não foi possivel captar seus ingressos
        </p>
      )}

      <div className='overflow-x-auto rounded-3xl border border-border bg-card'>
        <table className='w-full text-left text-body-sm'>
          <thead className='border-b border-border text-muted-foreground'>
            <tr>
              <th className='px-5 py-4 font-bold'>Nome do evento</th>
              <th className='px-5 py-4 font-bold'>Categoria</th>
              <th className='px-5 py-4 font-bold'>Início</th>
              <th className='px-5 py-4 font-bold'>Término</th>
              <th className='px-5 py-4 font-bold'>Quantidade</th>
              <th className='px-5 py-4 font-bold'>Preço</th>
              <th className='px-5 py-4'>
                <span className='sr-only'>Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((ticket) => (
              <tr
                key={ticket.id}
                className='border-b border-border last:border-0'
              >
                <td className='px-5 py-4 font-bold text-foreground'>
                  {ticket.event.name}
                </td>
                <td className='px-5 py-4'>{ticket.category}</td>
                <td className='px-5 py-4'>
                  {formatDate(ticket.event.start_date ?? '')}
                </td>
                <td className='px-5 py-4'>
                  {formatDate(ticket.event.created_at ?? '')}
                </td>
                <td className='px-5 py-4'>{ticket.quantity}</td>
                <td className='px-5 py-4'>{formatMoney(ticket.price)}</td>
                <td className='px-5 py-4 text-right'>
                  <Button type='button' variant='outline' size='sm'>
                    Cancelar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        totalPages={data?.totalPages ?? 0}
        buildHref={(targetPage) => `${MY_TICKETS_PATH}?pagina=${targetPage}`}
      />
    </>
  );
}
