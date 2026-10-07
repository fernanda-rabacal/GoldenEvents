import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getCurrentUser } from '@/services/auth';
import { formatFullDate } from '@/utils/format_date';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  // Sem login, cada página redireciona com o próprio caminho (requireUser), para o login voltar para ela
  if (!user) {
    return children;
  }

  return (
    <AdminShell user={user} today={formatFullDate(new Date())}>
      {children}
    </AdminShell>
  );
}
