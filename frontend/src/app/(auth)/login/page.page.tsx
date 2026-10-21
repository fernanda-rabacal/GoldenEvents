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
  searchParams: Promise<{
    redirect?: SearchParamValue;
    erro?: SearchParamValue;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect, erro } = await searchParams;

  return (
    <>
      <AuthHeading
        eyebrow='Bem-vindo de volta'
        title='Entre na Golden'
        description='Acesse seus ingressos e continue descobrindo bons momentos.'
      />
      {firstValue(erro) === 'google' && (
        <p
          role='alert'
          className='mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-body-sm text-destructive'
        >
          Não foi possível entrar com o Google. Tente novamente.
        </p>
      )}
      <LoginForm redirectTo={getSafeRedirect(firstValue(redirect))} />
      <AuthSwitchLink
        question='Ainda não tem uma conta?'
        label='Criar conta'
        href='/cadastro'
      />
    </>
  );
}
