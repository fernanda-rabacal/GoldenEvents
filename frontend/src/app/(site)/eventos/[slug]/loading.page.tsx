import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function EventDetailsLoading() {
  return (
    <SitePageSkeleton withHeading={false}>
      <div className='mt-7 grid gap-10 lg:grid-cols-[1.35fr_.85fr] lg:items-start'>
        <div>
          <Skeleton className='aspect-video rounded-4xl' />

          <div className='mt-8'>
            <Skeleton className='h-7 w-24 rounded-full' />
            <Skeleton className='mt-4 h-10 w-3/4 sm:h-12' />
            <Skeleton className='mt-4 h-8 w-2/3' />
          </div>

          <div className='mt-10 border-t border-border pt-8'>
            <Skeleton className='h-8 w-52' />
            <div className='mt-5 flex flex-col gap-3'>
              <Skeleton className='h-5' />
              <Skeleton className='h-5' />
              <Skeleton className='h-5 w-4/5' />
            </div>
          </div>

          <div className='mt-10 border-t border-border pt-8'>
            <Skeleton className='h-8 w-24' />
            <Skeleton className='mt-5 h-40 rounded-xl' />
          </div>
        </div>

        <div className='rounded-xl border border-border bg-card p-6 shadow-xl shadow-primary/5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='mt-2 h-8 w-56 max-w-full' />
            </div>
            <Skeleton className='size-9 rounded-lg' />
          </div>

          <div className='mt-7 flex flex-col gap-5 border-y border-border py-6'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='flex gap-3'>
                <Skeleton className='mt-0.5 size-5 shrink-0 rounded-full' />
                <div className='flex-1'>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='mt-1 h-5 w-1/2' />
                </div>
              </div>
            ))}
          </div>

          <Skeleton className='mt-6 h-5 w-20' />
          <Skeleton className='mt-1 h-8 w-32' />
          <Skeleton className='mt-6 h-11 rounded-lg' />
        </div>
      </div>
    </SitePageSkeleton>
  );
}
