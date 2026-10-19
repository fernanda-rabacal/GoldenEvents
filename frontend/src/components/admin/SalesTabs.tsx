import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SalesTab } from '@/utils/sales_search_params';

const TAB_LABELS = {
  vendas: 'Vendas',
  ingressos: 'Ingressos',
} satisfies Record<SalesTab, string>;

type SalesTabsProps = {
  current: SalesTab;
  buildHref: (tab: SalesTab) => string;
};

export function SalesTabs({ current, buildHref }: SalesTabsProps) {
  return (
    <nav aria-label='Visualização' className='mb-6 border-b border-border'>
      <ul className='flex gap-6'>
        {(Object.keys(TAB_LABELS) as SalesTab[]).map((tab) => (
          <li key={tab}>
            <Link
              href={buildHref(tab)}
              scroll={false}
              aria-current={tab === current ? 'page' : undefined}
              className={cn(
                '-mb-px inline-block border-b-2 px-1 pb-3 text-body font-bold transition-colors',
                tab === current
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[tab]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
