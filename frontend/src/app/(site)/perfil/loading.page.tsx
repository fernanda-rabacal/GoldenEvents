import {
  FieldSkeleton,
  ImageUploadSkeleton,
} from '@/components/form/FormSkeletons';
import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function ProfileLoading() {
  return (
    <SitePageSkeleton>
      <div className='mt-8 grid gap-8 rounded-xl border border-border bg-card p-6 lg:grid-cols-[0.9fr_1.1fr]'>
        <ImageUploadSkeleton />
        <div className='flex flex-col gap-5'>
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      <div className='mt-8 flex justify-end gap-3'>
        <Skeleton className='h-9 w-20 rounded-lg' />
        <Skeleton className='h-9 w-20 rounded-lg' />
      </div>

      <Skeleton className='mt-8 h-28 rounded-xl' />
    </SitePageSkeleton>
  );
}
