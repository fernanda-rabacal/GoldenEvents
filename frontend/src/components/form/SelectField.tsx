import { useId, type SelectHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function SelectField({
  label,
  id,
  children,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className='flex flex-col gap-2'>
      <label
        htmlFor={selectId}
        className='text-body-sm font-bold text-foreground/80'
      >
        {label}
      </label>
      <select
        id={selectId}
        className='w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-body text-foreground transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/40'
        {...selectProps}
      >
        {children}
      </select>
    </div>
  );
}
