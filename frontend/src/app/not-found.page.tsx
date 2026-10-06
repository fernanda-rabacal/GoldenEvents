import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/layout/NotFoundContent';
import { SiteShell } from '@/components/layout/SiteShell';

export const metadata: Metadata = {
  title: '404',
};

export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
