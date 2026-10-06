'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import type { z } from 'zod';
import { ArrowRight, Mail, UserRound } from 'lucide-react';
import { PasswordField } from '@/components/form/PasswordField';
import { TextField } from '@/components/form/TextField';
import { api } from '@/lib/axios';
import { toastNotify } from '@/lib/toastify';
import { maskDocument } from '@/utils/masks';
import { registerFormSchema } from '@/utils/schemaValidations';
import { OrganizerChoice } from './OrganizerChoice';
import { SubmitButton } from './SubmitButton';

type RegisterFormData = z.infer<typeof registerFormSchema>;

function getErrorMessage(error: unknown) {
  const message =
    error instanceof AxiosError ? error.response?.data?.message : undefined;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Não foi possível concluir o cadastro. Tente novamente.';
}

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { isOrganizer: 'false' },
  });

  async function handleRegister({
    name,
    email,
    password,
    cpf,
    isOrganizer,
  }: RegisterFormData) {
    try {
      await api.post('/users', {
        name,
        email,
        password,
        document: cpf.replace(/\D/g, ''),
        isOrganizer: isOrganizer === 'true',
      });

      toastNotify('success', 'Cadastro feito com sucesso! Agora é só entrar.');
      router.push('/login');
    } catch (error) {
      toastNotify('error', getErrorMessage(error));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleRegister)}
      noValidate
      className='flex flex-col gap-5'
    >
      <TextField
        label='Nome completo'
        icon={UserRound}
        autoComplete='name'
        placeholder='Como podemos chamar você?'
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label='CPF'
        inputMode='numeric'
        maxLength={14}
        placeholder='000.000.000-00'
        hint='Usado para identificar sua conta com segurança.'
        error={errors.cpf?.message}
        {...register('cpf', {
          onChange: (event) =>
            setValue('cpf', maskDocument(event.target.value)),
        })}
      />
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
        autoComplete='new-password'
        placeholder='Digite sua senha'
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label='Confirmar senha'
        autoComplete='new-password'
        placeholder='Digite sua senha novamente'
        error={errors.confirm_password?.message}
        {...register('confirm_password')}
      />
      <OrganizerChoice registration={register('isOrganizer')} />

      <SubmitButton
        isSubmitting={isSubmitting}
        submittingLabel='Criando sua conta...'
      >
        Criar minha conta <ArrowRight className='size-4' />
      </SubmitButton>
    </form>
  );
}
