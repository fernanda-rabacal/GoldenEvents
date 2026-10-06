import type { ReactNode } from 'react';

type AdminPageHeadingProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeading({
  title,
  description,
  actions,
}: AdminPageHeadingProps) {
  return (
    <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='text-h2 text-foreground'>{title}</h1>
        {description && (
          <p className='mt-2 text-body text-muted-foreground'>{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
