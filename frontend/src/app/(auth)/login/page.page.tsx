import type { Metadata } from 'next';
import { AuthHeading } from '@/components/auth/AuthHeading';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSafeRedirect } from '@/utils/auth_redirect';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';

export const metadata: Metadata = {
  title: 'Entrar',
};

type LoginPageProps = {
  searchParams: Promise<{ redirect?: SearchParamValue }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <>
      <AuthHeading
        eyebrow='Bem-vindo de volta'
        title='Entre na Golden'
        description='Acesse seus ingressos e continue descobrindo bons momentos.'
      />
      <LoginForm redirectTo={getSafeRedirect(firstValue(redirect))} />
      <AuthSwitchLink
        question='Ainda não tem uma conta?'
        label='Criar conta'
        href='/cadastro'
      />
    </>
  );
}
