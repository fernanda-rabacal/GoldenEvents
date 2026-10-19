import type { ReactNode } from 'react';
import { Skeleton } from '@/ui/skeleton';

type SitePageSkeletonProps = {
  withHeading?: boolean;
  children?: ReactNode;
};

export function SitePageSkeleton({
  withHeading = true,
  children,
}: SitePageSkeletonProps) {
  return (
    <main aria-busy className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <span role='status' className='sr-only'>
        Carregando...
      </span>
      <Skeleton className='h-5 w-44' />

      {withHeading && (
        <div className='mt-7'>
          <Skeleton className='h-5 w-28' />
          <Skeleton className='mt-2 h-9 w-72 max-w-full sm:h-10' />
          <Skeleton className='mt-2 h-6 w-full max-w-md' />
        </div>
      )}

      {children}
    </main>
  );
}
