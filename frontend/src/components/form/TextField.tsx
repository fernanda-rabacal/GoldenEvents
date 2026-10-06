import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import type { LucideIcon } from 'lucide-react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  icon: Icon,
  error,
  hint,
  trailing,
  ref,
  id,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className='flex flex-col gap-2'>
      <label
        htmlFor={inputId}
        className='text-body-sm font-bold text-foreground/80'
      >
        {label}
      </label>
      <div className='relative'>
        {Icon && (
          <Icon className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/60' />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`w-full rounded-2xl border border-input bg-card py-3.5 text-body text-foreground transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/40 aria-invalid:border-destructive aria-invalid:focus:ring-destructive/20 ${Icon ? 'pl-11' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'}`}
          {...inputProps}
        />
        {trailing}
      </div>
      {message && (
        <span
          id={messageId}
          className={`text-caption ${error ? 'text-destructive' : 'text-muted-foreground/80'}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
