import type { Metadata } from 'next';
import { AuthHeading } from '@/components/auth/AuthHeading';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { RegisterForm } from '@/components/auth/RegisterForm';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';

export const metadata: Metadata = {
  title: 'Criar conta',
};

type RegisterPageProps = {
  searchParams: Promise<{ organizador?: SearchParamValue }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const isOrganizer = firstValue((await searchParams).organizador) === '1';

  return (
    <>
      <AuthHeading
        eyebrow='Comece agora'
        title='Crie sua conta'
        description='Junte-se a uma comunidade que vive experiências únicas.'
      />
      <RegisterForm defaultIsOrganizer={isOrganizer} />
      <AuthSwitchLink
        question='Já tem uma conta?'
        label='Entrar'
        href='/login'
      />
    </>
  );
}
