import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/ui/button';

type EventsEmptyStateProps = {
  clearFiltersHref?: string;
};

export function EventsEmptyState({ clearFiltersHref }: EventsEmptyStateProps) {
  return (
    <div className='rounded-xl border border-dashed border-input bg-card px-6 py-16 text-center'>
      <Search className='mx-auto size-8 text-orange-500' />
      <h3 className='mt-4 text-h4 text-foreground'>Nenhum evento encontrado</h3>
      {clearFiltersHref && (
        <>
          <p className='mt-2 text-body-sm text-muted-foreground'>
            Tente buscar por outro termo ou escolha uma categoria diferente.
          </p>
          <Link
            href={clearFiltersHref}
            className={cn(buttonVariants(), 'mt-6')}
          >
            Limpar busca
          </Link>
        </>
      )}
    </div>
  );
}
