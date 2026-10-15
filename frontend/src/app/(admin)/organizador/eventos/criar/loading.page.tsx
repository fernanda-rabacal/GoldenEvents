import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { EventFormSkeleton } from '@/components/admin/EventFormSkeleton';

export default function CreateEventLoading() {
  return (
    <AdminPageSkeleton>
      <EventFormSkeleton />
    </AdminPageSkeleton>
  );
}
