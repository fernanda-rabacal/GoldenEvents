import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, buttonVariants } from '@/ui/button';

type TablePaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function TablePagination({
  page,
  totalPages,
  buildHref,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label='Paginação'
      className='mt-6 flex items-center justify-between gap-4'
    >
      <p className='text-body-sm text-muted-foreground'>
        Página {page} de {totalPages}
      </p>
      <div className='flex gap-2'>
        <PageLink href={page > 1 ? buildHref(page - 1) : undefined}>
          <ChevronLeft data-icon='inline-start' /> Anterior
        </PageLink>
        <PageLink href={page < totalPages ? buildHref(page + 1) : undefined}>
          Próxima <ChevronRight data-icon='inline-end' />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <Button variant='outline' disabled>
        {children}
      </Button>
    );
  }

  return (
    <Link href={href} className={buttonVariants({ variant: 'outline' })}>
      {children}
    </Link>
  );
}
