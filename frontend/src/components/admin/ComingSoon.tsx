import type { LucideIcon } from 'lucide-react';

type ComingSoonProps = {
  icon: LucideIcon;
  description: string;
};

export function ComingSoon({ icon: Icon, description }: ComingSoonProps) {
  return (
    <div className='flex flex-col items-center rounded-xl border border-dashed border-input bg-card px-6 py-16 text-center'>
      <span className='flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
        <Icon className='size-6' />
      </span>
      <p className='mt-5 text-h4 text-foreground'>Em breve</p>
      <p className='mt-2 max-w-md text-body text-muted-foreground'>
        {description}
      </p>
    </div>
  );
}
