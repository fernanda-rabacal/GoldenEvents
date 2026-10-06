import { useId, type Ref, type SelectHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
};

export function SelectField({
  label,
  error,
  id,
  ref,
  children,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className='flex flex-col gap-2'>
      <label
        htmlFor={selectId}
        className='text-body-sm font-bold text-foreground/80'
      >
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className='w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-body text-foreground transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 aria-invalid:border-destructive'
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <span id={errorId} className='text-caption text-destructive'>
          {error}
        </span>
      )}
    </div>
  );
}
