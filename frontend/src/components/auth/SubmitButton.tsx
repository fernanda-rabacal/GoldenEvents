import type { ReactNode } from 'react';

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
    <button
      type='submit'
      disabled={isSubmitting}
      className='mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-body-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60'
    >
      {isSubmitting ? submittingLabel : children}
    </button>
  );
}
