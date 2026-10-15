import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { FieldSkeleton } from '@/components/form/FormSkeletons';
import { Skeleton } from '@/ui/skeleton';

export default function MyEventsLoading() {
  return (
    <AdminPageSkeleton withAction>
      <div className='mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4'>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </div>

      <div className='rounded-xl border border-border bg-card'>
        <div className='border-b border-border px-5 py-4'>
          <Skeleton className='h-5 w-1/3' />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className='flex items-center gap-6 border-b border-border px-5 py-4 last:border-0'
          >
            <Skeleton className='h-5 w-8' />
            <Skeleton className='h-5 flex-1' />
            <Skeleton className='hidden h-5 w-24 md:block' />
            <Skeleton className='hidden h-5 w-32 lg:block' />
            <Skeleton className='h-6 w-12 rounded-full' />
            <Skeleton className='size-8 rounded-lg' />
          </div>
        ))}
      </div>
    </AdminPageSkeleton>
  );
}
