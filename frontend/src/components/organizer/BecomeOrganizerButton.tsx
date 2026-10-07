'use client';

import { useTransition } from 'react';
import { ArrowRight } from 'lucide-react';
import { toastNotify } from '@/lib/toastify';
import { becomeOrganizer } from '@/services/profile-actions';
import { Button } from '@/ui/button';

export function BecomeOrganizerButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await becomeOrganizer();

      if (!result.success) {
        toastNotify('error', result.message);
      }
    });
  }

  return (
    <Button
      size='lg'
      className='h-11 px-5 text-body-sm font-bold'
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? 'Ativando...' : 'Quero ser organizador'}
      <ArrowRight data-icon='inline-end' />
    </Button>
  );
}
