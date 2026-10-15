import { Skeleton } from '@/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-xl border border-border bg-white'>
      <Skeleton className='h-52 rounded-none' />
      <div className='p-5'>
        <Skeleton className='h-7 w-3/4' />
        <Skeleton className='mt-2 h-5 w-1/2' />
        <div className='mt-5 flex items-center justify-between gap-3'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-24' />
        </div>
      </div>
    </div>
  );
}
