import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthHeading } from '@/components/auth/AuthHeading';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { GoogleSignupForm } from '@/components/auth/GoogleSignupForm';
import { GOOGLE_SIGNUP_COOKIE } from '@/utils/auth_cookie';
import { getSafeRedirect } from '@/utils/auth_redirect';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';

export const metadata: Metadata = {
  title: 'Concluir cadastro',
};

type GoogleSignupPageProps = {
  searchParams: Promise<{ redirect?: SearchParamValue }>;
};

// Só lê nome e e-mail para exibir, sem conferir a assinatura: quem valida o token é a API
function readSignupClaims(token: string) {
  try {
    const { name, email } = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    );

    return typeof email === 'string'
      ? { name: String(name ?? ''), email }
      : null;
  } catch {
    return null;
  }
}

export default async function GoogleSignupPage({
  searchParams,
}: GoogleSignupPageProps) {
  const token = (await cookies()).get(GOOGLE_SIGNUP_COOKIE)?.value;
  const claims = token && readSignupClaims(token);

  if (!claims) {
    redirect('/login');
  }

  const { redirect: redirectTo } = await searchParams;
  const firstName = claims.name.split(' ')[0];

  return (
    <>
      <AuthHeading
        eyebrow='Quase lá'
        title={firstName ? `Falta pouco, ${firstName}` : 'Falta pouco'}
        description={`Para criar sua conta com ${claims.email}, só precisamos do seu CPF.`}
      />
      <GoogleSignupForm redirectTo={getSafeRedirect(firstValue(redirectTo))} />
      <AuthSwitchLink
        question='Não é você?'
        label='Entrar com outra conta'
        href='/login'
      />
    </>
  );
}
