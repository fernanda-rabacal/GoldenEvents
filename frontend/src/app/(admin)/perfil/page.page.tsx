import type { Metadata } from 'next';
import { UserTypeEnum } from '@golden-events/shared';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { ProfileForm } from '@/components/admin/ProfileForm';
import { PROFILE_PATH } from '@/components/layout/nav-links';
import { requireUser } from '@/services/auth';
import { getUserTypes } from '@/services/users';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default async function ProfilePage() {
  const user = await requireUser(PROFILE_PATH);
  const userTypes = await getUserTypes();
  const isAdmin = user.user_type_id === UserTypeEnum.ADMIN;

  // A API recusa que alguém se torne administrador pelo próprio perfil
  const availableUserTypes = isAdmin
    ? userTypes
    : userTypes.filter(({ id }) => id !== UserTypeEnum.ADMIN);

  return (
    <>
      <AdminPageHeading
        title='Perfil'
        description='Atualize seus dados de cadastro.'
      />
      <ProfileForm user={user} userTypes={availableUserTypes} />
    </>
  );
}
