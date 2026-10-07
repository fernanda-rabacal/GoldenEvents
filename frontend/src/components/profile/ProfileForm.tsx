'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { User } from '@golden-events/shared';
import { ImageUpload } from '@/components/form/ImageUpload';
import { TextField } from '@/components/form/TextField';
import { toastNotify } from '@/lib/toastify';
import { updateProfile } from '@/services/profile-actions';
import { Button } from '@/ui/button';
import { maskDocument } from '@/utils/masks';
import { updateUserValidationSchema } from '@/utils/schemaValidations';

type ProfileFormInput = z.input<typeof updateUserValidationSchema>;
type ProfileFormOutput = z.output<typeof updateUserValidationSchema>;

type ProfileFormProps = {
  user: User;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(updateUserValidationSchema),
    defaultValues: {
      name: user.name,
    },
  });

  function handleSave({ name }: ProfileFormOutput) {
    startTransition(async () => {
      const result = await updateProfile({ name });

      if (!result.success) {
        toastNotify('error', result.message);
        return;
      }

      toastNotify('success', result.message);
      // Atualiza o nome no menu do usuário
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      noValidate
      className='flex flex-col gap-8'
    >
      <div className='grid gap-8 rounded-xl border border-border bg-card p-6 lg:grid-cols-[0.9fr_1.1fr]'>
        {/* A API ainda não recebe a foto: o upload só mostra a prévia */}
        <ImageUpload
          label='Foto de perfil (PNG ou JPEG de até 2MB)'
          onChange={(base64) => setValue('photo', base64)}
        />

        <div className='flex flex-col gap-5'>
          <TextField
            label='Nome'
            placeholder='Nome e sobrenome'
            autoComplete='name'
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField label='CPF' value={maskDocument(user.document)} disabled />
          <TextField label='E-mail' type='email' value={user.email} disabled />
        </div>
      </div>

      <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          size='lg'
          disabled={isPending}
          onClick={() => router.back()}
        >
          Voltar
        </Button>
        <Button type='submit' size='lg' disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
