import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type DetailsSectionProps = {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
};

export function DetailsSection({
  title,
  icon: Icon,
  children,
}: DetailsSectionProps) {
  return (
    <section className='mt-10 border-t border-border pt-8'>
      <div className='flex items-center gap-3'>
        {Icon && <Icon className='size-6 text-orange-500' />}
        <h2 className='text-h3 text-foreground'>{title}</h2>
      </div>
      <div className='mt-5'>{children}</div>
    </section>
  );
}
