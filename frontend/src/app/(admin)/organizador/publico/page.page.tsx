import type { Metadata } from 'next';
import { UsersRound } from 'lucide-react';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { AUDIENCE_PATH } from '@/components/layout/nav-links';
import { requireOrganizer } from '@/services/auth';

export const metadata: Metadata = {
  title: 'Público',
};

export default async function AudiencePage() {
  await requireOrganizer(AUDIENCE_PATH);

  return (
    <>
      <AdminPageHeading
        title='Público'
        description='Conheça quem participa dos seus eventos.'
      />
      <ComingSoon
        icon={UsersRound}
        description='Em breve você vai ver aqui quem comprou ingressos para os seus eventos.'
      />
    </>
  );
}
