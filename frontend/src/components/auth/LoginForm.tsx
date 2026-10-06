'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowRight, Mail } from 'lucide-react';
import { PasswordField } from '@/components/form/PasswordField';
import { TextField } from '@/components/form/TextField';
import { useAuth } from '@/hooks/useAuth';
import { loginFormSchema } from '@/utils/schemaValidations';
import { SubmitButton } from './SubmitButton';

type LoginFormData = z.infer<typeof loginFormSchema>;

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { keep_connected: false },
  });

  async function handleSignIn(data: LoginFormData) {
    const hasLogged = await signIn(data);

    if (hasLogged) {
      router.replace(redirectTo);
      // Atualiza o header (server component) com o usuário recém-logado
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleSignIn)}
      noValidate
      className='flex flex-col gap-5'
    >
      <TextField
        label='E-mail'
        type='email'
        icon={Mail}
        autoComplete='email'
        placeholder='voce@email.com'
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label='Senha'
        autoComplete='current-password'
        placeholder='Digite sua senha'
        error={errors.password?.message}
        {...register('password')}
      />

      <div className='flex items-center justify-between gap-4'>
        <label className='text-caption text-foreground/80 flex cursor-pointer items-center gap-2 font-bold'>
          <input
            type='checkbox'
            className='accent-primary size-4'
            {...register('keep_connected')}
          />
          Manter conectado
        </label>
        <a
          href='#recuperar'
          className='text-caption text-accent-foreground font-bold hover:text-orange-500'
        >
          Esqueci minha senha
        </a>
      </div>

      <SubmitButton isSubmitting={isSubmitting} submittingLabel='Entrando...'>
        Entrar na minha conta <ArrowRight className='size-4' />
      </SubmitButton>
    </form>
  );
}
