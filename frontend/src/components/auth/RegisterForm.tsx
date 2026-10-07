'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowRight, Mail, UserRound } from 'lucide-react';
import { PasswordField } from '@/components/form/PasswordField';
import { TextField } from '@/components/form/TextField';
import { CREATE_EVENT_PATH } from '@/components/layout/nav-links';
import { toastNotify } from '@/lib/toastify';
import { signUp } from '@/services/auth-actions';
import { buildLoginHref } from '@/utils/auth_redirect';
import { maskDocument } from '@/utils/masks';
import { registerFormSchema } from '@/utils/schemaValidations';
import { OrganizerChoice } from './OrganizerChoice';
import { SubmitButton } from './SubmitButton';

type RegisterFormData = z.infer<typeof registerFormSchema>;

type RegisterFormProps = {
  defaultIsOrganizer?: boolean;
};

export function RegisterForm({
  defaultIsOrganizer = false,
}: RegisterFormProps) {
  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { isOrganizer: defaultIsOrganizer ? 'true' : 'false' },
  });

  async function handleRegister({
    name,
    email,
    password,
    cpf,
    isOrganizer,
  }: RegisterFormData) {
    const result = await signUp({
      name,
      email,
      password,
      document: cpf.replace(/\D/g, ''),
      isOrganizer: isOrganizer === 'true',
    });

    if (!result.success) {
      toastNotify('error', result.message);
      return;
    }

    toastNotify('success', result.message);
    router.push(
      isOrganizer === 'true' ? buildLoginHref(CREATE_EVENT_PATH) : '/login',
    );
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
