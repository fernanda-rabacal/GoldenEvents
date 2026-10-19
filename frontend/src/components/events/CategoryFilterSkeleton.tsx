import { cn } from '@/lib/utils';
import { Skeleton } from '@/ui/skeleton';

const CHIP_WIDTHS = ['w-14', 'w-20', 'w-24', 'w-16', 'w-20'];

export function CategoryFilterSkeleton() {
  return (
    <div className='flex min-w-0 gap-2 overflow-hidden py-1'>
      {CHIP_WIDTHS.map((width, index) => (
        <Skeleton
          key={index}
          className={cn('h-8 shrink-0 rounded-lg', width)}
        />
      ))}
    </div>
  );
}
