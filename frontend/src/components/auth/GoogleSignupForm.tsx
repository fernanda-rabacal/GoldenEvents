'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { TextField } from '@/components/form/TextField';
import { toastNotify } from '@/lib/toastify';
import { completeGoogleSignUp } from '@/services/auth-actions';
import { maskDocument } from '@/utils/masks';
import { googleSignupFormSchema } from '@/utils/schemaValidations';
import { OrganizerChoice } from './OrganizerChoice';
import { SubmitButton } from './SubmitButton';

type GoogleSignupFormData = z.infer<typeof googleSignupFormSchema>;

type GoogleSignupFormProps = {
  redirectTo: string;
};

export function GoogleSignupForm({ redirectTo }: GoogleSignupFormProps) {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoogleSignupFormData>({
    resolver: zodResolver(googleSignupFormSchema),
    defaultValues: { isOrganizer: 'false' },
  });

  async function handleComplete({ cpf, isOrganizer }: GoogleSignupFormData) {
    const result = await completeGoogleSignUp(
      {
        document: cpf.replace(/\D/g, ''),
        isOrganizer: isOrganizer === 'true',
      },
      redirectTo,
    );

    if (!result.success) {
      toastNotify('error', result.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleComplete)}
      noValidate
      className='flex flex-col gap-5'
    >
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
      <OrganizerChoice registration={register('isOrganizer')} />

      <SubmitButton
        isSubmitting={isSubmitting}
        submittingLabel='Criando sua conta...'
      >
        Concluir cadastro <ArrowRight className='size-4' />
      </SubmitButton>
    </form>
  );
}
