'use client';

import Link from 'next/link';
import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/ui/button';

export type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

type ErrorContentProps = {
  digest?: string;
  retry: () => void;
  homeHref: string;
  homeLabel: string;
};

export function ErrorContent({
  digest,
  retry,
  homeHref,
  homeLabel,
}: ErrorContentProps) {
  return (
    <div className='flex flex-col items-center px-5 py-20 text-center'>
      <span className='flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground'>
        <TriangleAlert className='size-7' />
      </span>
      <h1 className='mt-6 text-h2 text-foreground'>Algo deu errado</h1>
      <p className='mt-3 max-w-md text-body text-muted-foreground'>
        Não foi possível carregar esta página. Tente novamente em alguns
        instantes.
      </p>

      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        <Button size='lg' onClick={() => retry()}>
          <RotateCw data-icon='inline-start' /> Tentar novamente
        </Button>
        <Link
          href={homeHref}
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          {homeLabel}
        </Link>
      </div>

      {digest && (
        <p className='mt-6 text-caption text-muted-foreground/70'>
          Código do erro: {digest}
        </p>
      )}
    </div>
  );
}
