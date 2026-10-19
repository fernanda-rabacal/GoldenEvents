import {
  FieldSkeleton,
  ImageUploadSkeleton,
  RichTextEditorSkeleton,
} from '@/components/form/FormSkeletons';
import { Skeleton } from '@/ui/skeleton';

export function EventFormSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='grid gap-8 rounded-xl border border-border bg-card p-6 lg:grid-cols-[0.9fr_1.1fr]'>
        <ImageUploadSkeleton />
        <div className='flex flex-col gap-5'>
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <div className='grid gap-5 sm:grid-cols-2'>
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-5 rounded-xl border border-border bg-card p-6'>
        <div>
          <Skeleton className='h-7 w-52' />
          <Skeleton className='mt-1 h-5 w-full max-w-xl' />
        </div>
        <Skeleton className='h-48 rounded-2xl' />
        <Skeleton className='h-9 w-40 rounded-lg' />
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <RichTextEditorSkeleton />
      </div>
    </div>
  );
}
