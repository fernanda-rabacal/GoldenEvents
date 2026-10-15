import { FieldSkeleton } from '@/components/form/FormSkeletons';
import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function CheckoutLoading() {
  return (
    <SitePageSkeleton>
      <div className='mt-8 grid gap-10 lg:grid-cols-[1.35fr_.85fr] lg:items-start'>
        <div className='rounded-xl border border-border bg-card p-6'>
          <Skeleton className='h-8 w-56' />
          <div className='mt-5 grid gap-3 sm:grid-cols-2'>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className='h-14 rounded-2xl' />
            ))}
          </div>
          <div className='mt-6 flex flex-col gap-5'>
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </div>

        <div className='rounded-xl border border-border bg-card p-6 shadow-xl shadow-primary/5'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='mt-2 h-8 w-3/4' />
          <Skeleton className='mt-2 h-5 w-2/3' />
          <Skeleton className='mt-1 h-5 w-1/2' />

          <div className='mt-6 flex items-center justify-between border-y border-border py-5'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-7 w-28' />
          </div>

          <div className='mt-5 flex flex-col gap-2'>
            <Skeleton className='h-5' />
            <Skeleton className='h-5' />
          </div>

          <div className='mt-5 flex items-center justify-between border-t border-border pt-5'>
            <Skeleton className='h-6 w-12' />
            <Skeleton className='h-8 w-32' />
          </div>

          <div className='mt-6 flex flex-col gap-3'>
            <Skeleton className='h-9 rounded-lg' />
            <Skeleton className='h-9 rounded-lg' />
          </div>
        </div>
      </div>
    </SitePageSkeleton>
  );
}
