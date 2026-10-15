import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function OrganizerLoading() {
  return (
    <AdminPageSkeleton>
      <Skeleton className='h-64 rounded-xl' />
    </AdminPageSkeleton>
  );
}
