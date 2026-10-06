import type { UseFormRegisterReturn } from 'react-hook-form';

const OPTIONS = [
  { value: 'false', label: 'Não', description: 'Quero descobrir eventos' },
  { value: 'true', label: 'Sim', description: 'Quero criar eventos' },
];

type OrganizerChoiceProps = {
  registration: UseFormRegisterReturn<'isOrganizer'>;
};

export function OrganizerChoice({ registration }: OrganizerChoiceProps) {
  return (
    <fieldset className='flex flex-col gap-3'>
      <legend className='mb-3 text-body-sm font-bold text-foreground/80'>
        Você é organizador?
      </legend>
      <div className='grid grid-cols-2 gap-3'>
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className='cursor-pointer rounded-2xl border border-input bg-card p-4 transition hover:border-ring/60 has-checked:border-ring has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring/40'
          >
            <input
              type='radio'
              value={option.value}
              className='sr-only'
              {...registration}
            />
            <span className='block text-body-sm font-bold text-foreground'>
              {option.label}
            </span>
            <span className='mt-1 block text-caption text-muted-foreground'>
              {option.description}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
