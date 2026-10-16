import type { LotSalesStatus, SectorSales } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney, formatTicketPrice } from '@/utils/format_money';

const LOT_STATUS = {
  on_sale: { label: 'À venda', className: 'bg-green-50 text-green-600' },
  scheduled: { label: 'Agendado', className: 'bg-accent text-orange-800' },
  queued: { label: 'Na fila', className: 'bg-muted text-muted-foreground' },
  ended: { label: 'Encerrado', className: 'bg-muted text-muted-foreground' },
  sold_out: { label: 'Esgotado', className: 'bg-red-50 text-red-500' },
} satisfies Record<LotSalesStatus, { label: string; className: string }>;

function percent(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

type LotSalesListProps = {
  sectors: SectorSales[];
};

export function LotSalesList({ sectors }: LotSalesListProps) {
  if (sectors.length === 0) {
    return (
      <p className='rounded-xl border border-dashed border-input bg-card p-10 text-center text-body text-muted-foreground'>
        Este evento ainda não tem ingressos cadastrados.
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {sectors.map((sector) => {
        const sold = sector.lots.reduce((sum, lot) => sum + lot.sold, 0);
        const quantity = sector.lots.reduce(
          (sum, lot) => sum + lot.quantity,
          0,
        );
        const revenue = sector.lots.reduce((sum, lot) => sum + lot.revenue, 0);

        return (
          <section
            key={sector.id}
            aria-labelledby={`sector-${sector.id}`}
            className='rounded-xl border border-border bg-card'
          >
            <header className='flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4'>
              <h3
                id={`sector-${sector.id}`}
                className='text-h4 text-foreground'
              >
                {sector.name}
              </h3>
              <p className='text-body-sm text-muted-foreground'>
                {sold.toLocaleString('pt-BR')} de{' '}
                {quantity.toLocaleString('pt-BR')} vendidos ·{' '}
                {formatMoney(revenue)}
              </p>
            </header>

            <ul className='divide-y divide-border'>
              {sector.lots.map((lot) => {
                const status = LOT_STATUS[lot.status];

                return (
                  <li
                    key={lot.id}
                    className='grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] md:items-center md:gap-6'
                  >
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-bold text-foreground'>{lot.name}</p>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-caption font-bold',
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className='mt-1 text-caption text-muted-foreground'>
                        {formatTicketPrice(lot.price)}
                        {lot.sales_start &&
                          ` · a partir de ${formatShortDateTime(lot.sales_start)}`}
                        {lot.sales_end &&
                          ` · até ${formatShortDateTime(lot.sales_end)}`}
                      </p>
                    </div>

                    <div>
                      <div
                        role='img'
                        aria-label={`${lot.sold} de ${lot.quantity} vendidos, ${lot.reserved} reservados`}
                        className='flex h-2.5 overflow-hidden rounded-full bg-muted'
                      >
                        <div
                          className='bg-primary'
                          style={{
                            width: `${percent(lot.sold, lot.quantity)}%`,
                          }}
                        />
                        <div
                          className='bg-orange-300'
                          style={{
                            width: `${percent(lot.reserved, lot.quantity)}%`,
                          }}
                        />
                      </div>
                      <p
                        aria-hidden
                        className='mt-2 text-caption text-muted-foreground'
                      >
                        <span className='font-bold text-foreground'>
                          {lot.sold.toLocaleString('pt-BR')}
                        </span>{' '}
                        de {lot.quantity.toLocaleString('pt-BR')} vendidos
                        {lot.reserved > 0 &&
                          ` · ${lot.reserved.toLocaleString('pt-BR')} reservados`}
                      </p>
                    </div>

                    <p className='text-body font-black text-foreground md:text-right'>
                      {formatMoney(lot.revenue)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
