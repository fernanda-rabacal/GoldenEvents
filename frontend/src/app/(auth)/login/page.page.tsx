import type { Metadata } from 'next';
import { AuthHeading } from '@/components/auth/AuthHeading';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar',
};

export default function LoginPage() {
  return (
    <>
      <AuthHeading
        eyebrow='Bem-vindo de volta'
        title='Entre na Golden'
        description='Acesse seus ingressos e continue descobrindo bons momentos.'
      />
      <LoginForm />
      <AuthSwitchLink
        question='Ainda não tem uma conta?'
        label='Criar conta'
        href='/cadastro'
      />
    </>
  );
}
