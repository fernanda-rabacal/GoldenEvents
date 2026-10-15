import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function MyTicketsLoading() {
  return (
    <SitePageSkeleton>
      <div className='mt-8 grid gap-3 sm:grid-cols-3'>
        <Skeleton className='h-36 rounded-xl' />
        <Skeleton className='h-36 rounded-xl' />
        <Skeleton className='h-36 rounded-xl' />
      </div>

      <div className='mt-6 flex flex-col gap-4'>
        {Array.from({ length: 3 }, (_, index) => (
          <TicketCardSkeleton key={index} />
        ))}
      </div>
    </SitePageSkeleton>
  );
}

function TicketCardSkeleton() {
  return (
    <div className='flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:flex-row'>
      <Skeleton className='h-40 shrink-0 rounded-none sm:h-auto sm:w-44' />

      <div className='flex min-w-0 flex-1 flex-col gap-2 px-5 py-5'>
        <Skeleton className='h-6 w-28 rounded-full' />
        <Skeleton className='h-7 w-2/3' />
        <Skeleton className='h-5 w-1/2' />
        <Skeleton className='h-5 w-2/5' />
        <Skeleton className='mt-2 h-4 w-1/3' />
      </div>

      <div className='flex items-center justify-end gap-3 border-t border-border px-5 py-4 sm:w-40 sm:flex-col sm:justify-center sm:border-t-0 sm:border-l'>
        <Skeleton className='h-10 w-32 rounded-xl' />
        <Skeleton className='size-9 rounded-xl' />
      </div>
    </div>
  );
}
