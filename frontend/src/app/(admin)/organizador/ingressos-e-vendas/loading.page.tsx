import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { FieldSkeleton } from '@/components/form/FormSkeletons';
import { Skeleton } from '@/ui/skeleton';

export default function TicketSalesLoading() {
  return (
    <AdminPageSkeleton>
      <div className='mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4'>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </div>

      <div className='mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className='rounded-xl border border-border bg-card p-5'
          >
            <Skeleton className='size-10 rounded-xl' />
            <Skeleton className='mt-6 h-4 w-28' />
            <Skeleton className='mt-2 h-8 w-32' />
          </div>
        ))}
      </div>

      <div className='mb-6 flex gap-6 border-b border-border pb-3'>
        <Skeleton className='h-6 w-16' />
        <Skeleton className='h-6 w-20' />
      </div>

      <div className='rounded-xl border border-border bg-card'>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className='flex items-center gap-6 border-b border-border px-5 py-4 last:border-0'
          >
            <Skeleton className='h-5 w-20' />
            <Skeleton className='size-9 rounded-full' />
            <Skeleton className='h-5 flex-1' />
            <Skeleton className='hidden h-5 w-24 md:block' />
            <Skeleton className='h-6 w-16 rounded-full' />
            <Skeleton className='h-5 w-20' />
          </div>
        ))}
      </div>
    </AdminPageSkeleton>
  );
}
