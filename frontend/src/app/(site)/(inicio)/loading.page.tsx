import { CategoryFilterSkeleton } from '@/components/events/CategoryFilterSkeleton';
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function HomeLoading() {
  return (
    <main aria-busy className='overflow-hidden'>
      <span role='status' className='sr-only'>
        Carregando...
      </span>

      <section className='mx-auto max-w-6xl px-5 pt-8 pb-20 lg:px-8 lg:pt-16'>
        <div className='grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]'>
          <div>
            <Skeleton className='mb-6 h-8 w-60 rounded-full' />
            <Skeleton className='h-12 w-full max-w-md sm:h-15 lg:h-18' />
            <Skeleton className='mt-3 h-12 w-3/4 max-w-sm sm:h-15 lg:h-18' />
            <Skeleton className='mt-6 h-6 w-full max-w-lg' />
            <Skeleton className='mt-2 h-6 w-2/3 max-w-sm' />
            <Skeleton className='mt-7 h-14 w-full max-w-xl rounded-2xl' />
            <div className='mt-9 flex gap-4'>
              <Skeleton className='h-9 w-40 rounded-lg' />
              <Skeleton className='h-9 w-36 rounded-lg' />
            </div>
          </div>
          <Skeleton className='min-h-105 rounded-3xl lg:min-h-128' />
        </div>
      </section>

      <section className='bg-card px-5 py-20 lg:px-8'>
        <div className='mx-auto max-w-6xl'>
          <div className='mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end'>
            <div className='shrink-0'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='mt-2 h-9 w-64 sm:h-10' />
            </div>
            <CategoryFilterSkeleton />
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>
      </section>
    </main>
  );
}
