import { cn } from '@/lib/utils';

type AuthDividerProps = {
  label: string;
  className?: string;
};

export function AuthDivider({ label, className }: AuthDividerProps) {
  return (
    <div
      className={cn(
        'my-7 flex items-center gap-4 text-caption text-muted-foreground/70',
        className,
      )}
    >
      <span className='h-px flex-1 bg-border' /> {label}{' '}
      <span className='h-px flex-1 bg-border' />
    </div>
  );
}
