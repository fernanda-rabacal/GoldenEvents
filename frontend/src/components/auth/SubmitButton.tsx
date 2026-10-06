import type { ReactNode } from 'react';
import { Button } from '@/ui/button';

type SubmitButtonProps = {
  isSubmitting: boolean;
  submittingLabel: string;
  children: ReactNode;
};

export function SubmitButton({
  isSubmitting,
  submittingLabel,
  children,
}: SubmitButtonProps) {
  return (
    <Button type='submit' size='lg' disabled={isSubmitting} className='mt-1'>
      {isSubmitting ? submittingLabel : children}
    </Button>
  );
}
