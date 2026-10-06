import type { Metadata } from 'next';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { ORGANIZER_PATH } from '@/components/layout/nav-links';
import { requireUser } from '@/services/auth';

export const metadata: Metadata = {
  title: 'Área do Produtor',
};

export default async function OrganizerDashboardPage() {
  const user = await requireUser(ORGANIZER_PATH);
  const firstName = user.name.split(' ')[0];

  return (
    <AdminPageHeading
      title={`Olá, ${firstName}`}
      description='Gerencie seus eventos, acompanhe suas compras e atualize seu perfil.'
    />
  );
}
