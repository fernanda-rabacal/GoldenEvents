import type { LucideIcon } from 'lucide-react';

type EventInfoItemProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function EventInfoItem({
  icon: Icon,
  title,
  description,
}: EventInfoItemProps) {
  return (
    <div className='flex gap-3'>
      <Icon className='mt-0.5 size-5 shrink-0 text-orange-500' />
      <div>
        <p className='font-bold text-foreground'>{title}</p>
        {description && (
          <p className='mt-1 text-body-sm text-muted-foreground'>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
