import { CategoryFilterSkeleton } from '@/components/events/CategoryFilterSkeleton';
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton';
import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function EventsLoading() {
  return (
    <SitePageSkeleton>
      <div className='mt-10 flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <Skeleton className='mb-3 h-5 w-20' />
          <CategoryFilterSkeleton />
        </div>
        <Skeleton className='h-8 w-52' />
      </div>

      <Skeleton className='mt-8 h-7 w-48' />

      <div className='mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </SitePageSkeleton>
  );
}
