import type { Metadata } from 'next';
import { AuthHeading } from '@/components/auth/AuthHeading';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Criar conta',
};

export default function RegisterPage() {
  return (
    <>
      <AuthHeading
        eyebrow='Comece agora'
        title='Crie sua conta'
        description='Junte-se a uma comunidade que vive experiências únicas.'
      />
      <RegisterForm />
      <AuthSwitchLink
        question='Já tem uma conta?'
        label='Entrar'
        href='/login'
      />
    </>
  );
}
