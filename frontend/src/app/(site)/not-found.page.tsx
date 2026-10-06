import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/layout/NotFoundContent';

export const metadata: Metadata = {
  title: '404',
};

// notFound() dentro de (site) já renderiza dentro do SiteShell do layout
export default function SiteNotFound() {
  return <NotFoundContent />;
}
