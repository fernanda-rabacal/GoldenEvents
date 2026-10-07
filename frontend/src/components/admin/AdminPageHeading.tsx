import type { ReactNode } from 'react';

type AdminPageHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeading({
  title,
  eyebrow,
  description,
  actions,
}: AdminPageHeadingProps) {
  return (
    <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        {eyebrow && (
          <p className='mb-3 text-caption font-bold tracking-eyebrow text-secondary uppercase'>
            {eyebrow}
          </p>
        )}
        <h1 className='text-h1 text-foreground'>{title}</h1>
        {description && (
          <p className='mt-2 text-body text-muted-foreground'>{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
