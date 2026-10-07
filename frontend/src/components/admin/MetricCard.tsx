import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    tone: 'positive' | 'negative' | 'neutral';
    description: string;
  };
};

const BADGE_TONES = {
  positive: 'bg-green-50 text-green-600',
  negative: 'bg-red-50 text-red-500',
  neutral: 'bg-muted text-muted-foreground',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  badge,
}: MetricCardProps) {
  return (
    <div className='rounded-xl border border-border bg-card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <span className='flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
          <Icon className='size-5' />
        </span>
        {badge && (
          <span
            title={badge.description}
            className={cn(
              'rounded-full px-2.5 py-1 text-caption font-bold',
              BADGE_TONES[badge.tone],
            )}
          >
            {badge.text}
            <span className='sr-only'> {badge.description}</span>
          </span>
        )}
      </div>
      <p className='mt-6 text-body-sm text-muted-foreground'>{label}</p>
      <p className='mt-1 text-h3 text-foreground'>{value}</p>
    </div>
  );
}
