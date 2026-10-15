import type { ReactNode } from 'react';
import { Skeleton } from '@/ui/skeleton';

type AdminPageSkeletonProps = {
  withEyebrow?: boolean;
  withAction?: boolean;
  children?: ReactNode;
};

export function AdminPageSkeleton({
  withEyebrow = false,
  withAction = false,
  children,
}: AdminPageSkeletonProps) {
  return (
    <div aria-busy>
      <span role='status' className='sr-only'>
        Carregando...
      </span>

      <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          {withEyebrow && <Skeleton className='mb-3 h-4 w-36' />}
          <Skeleton className='h-10 w-64 max-w-full' />
          <Skeleton className='mt-2 h-6 w-80 max-w-full' />
        </div>
        {withAction && <Skeleton className='h-9 w-36 rounded-lg' />}
      </div>

      {children}
    </div>
  );
}
