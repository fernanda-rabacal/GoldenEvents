import { Skeleton } from '@/ui/skeleton';

export function FieldSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-5 w-28' />
      <Skeleton className='h-13 rounded-2xl' />
    </div>
  );
}

export function ImageUploadSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-5 w-64 max-w-full' />
      <Skeleton className='aspect-video rounded-2xl' />
    </div>
  );
}

export function RichTextEditorSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-5 w-80 max-w-full' />
      <Skeleton className='h-92 rounded-2xl' />
    </div>
  );
}
