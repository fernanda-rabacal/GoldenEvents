import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function OrganizerDashboardLoading() {
  return (
    <AdminPageSkeleton withEyebrow withAction>
      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className='rounded-xl border border-border bg-card p-5'
          >
            <div className='flex items-start justify-between gap-3'>
              <Skeleton className='size-10 rounded-xl' />
              <Skeleton className='h-6 w-14 rounded-full' />
            </div>
            <Skeleton className='mt-6 h-5 w-32' />
            <Skeleton className='mt-1 h-8 w-24' />
          </div>
        ))}
      </div>

      <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
        <div className='rounded-xl border border-border bg-card p-6'>
          <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
            <div>
              <Skeleton className='h-7 w-56' />
              <Skeleton className='mt-1 h-5 w-64 max-w-full' />
            </div>
            <Skeleton className='h-9 w-40 rounded-xl' />
          </div>
          <Skeleton className='h-62 rounded-lg' />
        </div>
        <Skeleton className='min-h-72 rounded-xl' />
      </div>

      <Skeleton className='mt-6 h-96 rounded-xl' />
    </AdminPageSkeleton>
  );
}
