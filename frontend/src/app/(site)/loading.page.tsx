import { SitePageSkeleton } from '@/components/layout/SitePageSkeleton';
import { Skeleton } from '@/ui/skeleton';

export default function SiteLoading() {
  return (
    <SitePageSkeleton>
      <Skeleton className='mt-8 h-80 rounded-xl' />
    </SitePageSkeleton>
  );
}
