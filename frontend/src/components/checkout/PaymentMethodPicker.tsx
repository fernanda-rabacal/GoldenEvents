import type { PaymentOption } from './payment-options';

type PaymentMethodPickerProps = {
  options: PaymentOption[];
  value?: number;
  onChange: (paymentMethodId: number) => void;
};

export function PaymentMethodPicker({
  options,
  value,
  onChange,
}: PaymentMethodPickerProps) {
  return (
    <fieldset className='grid gap-3 sm:grid-cols-2'>
      <legend className='sr-only'>Forma de pagamento</legend>
      {options.map(({ id, name, icon: Icon }) => (
        <label
          key={id}
          className='flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 font-bold text-foreground transition hover:border-ring has-checked:border-primary has-checked:bg-accent'
        >
          <input
            type='radio'
            name='payment_method'
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            className='accent-primary'
          />
          <Icon className='size-5 text-orange-500' />
          {name}
        </label>
      ))}
    </fieldset>
  );
}
