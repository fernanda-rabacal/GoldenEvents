import dayjs from 'dayjs';
import type { DailySales } from '@golden-events/shared';
import { cn } from '@/lib/utils';

type SalesChartProps = {
  data: DailySales[];
};

// Com 30 dias, rotula só um a cada 5 (sempre incluindo o dia de hoje)
const LABEL_EVERY_N_DAYS = 5;

function formatTickets(tickets: number) {
  return `${tickets} ${tickets === 1 ? 'ingresso' : 'ingressos'}`;
}

export function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map(({ tickets }) => tickets), 0);
  const peakIndex = data.findIndex(({ tickets }) => tickets === max);
  const isDense = data.length > 7;

  return (
    <div>
      <div className='relative flex h-56 border-b border-l border-border px-2 sm:px-3'>
        {max === 0 && (
          <p className='absolute inset-0 flex items-center justify-center text-body-sm text-muted-foreground'>
            Nenhum ingresso vendido no período.
          </p>
        )}
        <div
          aria-hidden
          className={cn(
            'flex flex-1 items-end',
            isDense ? 'gap-0.5 sm:gap-1' : 'gap-2 sm:gap-4',
          )}
        >
          {data.map(({ date, tickets }, index) => (
            <div
              key={date}
              className='group relative flex h-full flex-1 items-end'
            >
              {tickets > 0 && (
                <div
                  style={{ height: `${(tickets / max) * 100}%` }}
                  className={cn(
                    'min-h-1 w-full rounded-t-lg transition-colors',
                    isDense && 'rounded-t-sm',
                    index === peakIndex
                      ? 'bg-primary'
                      : 'bg-orange-300 group-hover:bg-orange-400',
                  )}
                />
              )}
              <span className='pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-caption whitespace-nowrap text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
                <span className='font-bold'>{dayjs(date).format('DD/MM')}</span>{' '}
                · {formatTickets(tickets)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className={cn(
          'flex px-2 pt-2 sm:px-3',
          isDense ? 'gap-0.5 sm:gap-1' : 'gap-2 sm:gap-4',
        )}
      >
        {data.map(({ date }, index) => {
          const showLabel =
            !isDense || (data.length - 1 - index) % LABEL_EVERY_N_DAYS === 0;

          return (
            <span
              key={date}
              className='flex-1 text-center text-[0.6875rem] whitespace-nowrap text-muted-foreground'
            >
              {showLabel ? dayjs(date).format('DD/MM') : ''}
            </span>
          );
        })}
      </div>

      <table className='sr-only'>
        <caption>Ingressos vendidos por dia</caption>
        <thead>
          <tr>
            <th scope='col'>Dia</th>
            <th scope='col'>Ingressos vendidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ date, tickets }) => (
            <tr key={date}>
              <td>{dayjs(date).format('DD/MM/YYYY')}</td>
              <td>{tickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
