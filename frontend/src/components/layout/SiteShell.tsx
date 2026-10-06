import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <div className='flex-1'>{children}</div>
      <SiteFooter />
    </div>
  );
}
