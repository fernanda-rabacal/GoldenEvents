import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';
import { formatMoney } from '@/utils/format_money';

const MAX_INSTALLMENTS = 6;
// Juros mockados por parcela adicional
const INSTALLMENT_FEE_RATE = 0.015;

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);

function getYears() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 11 }, (_, index) => currentYear + index);
}

function getInstallments(total: number) {
  return Array.from({ length: MAX_INSTALLMENTS }, (_, index) => {
    const count = index + 1;
    const value = total / count;

    return { count, value: value + value * INSTALLMENT_FEE_RATE * index };
  });
}

type CardPaymentFormProps = {
  total: number;
  withInstallments: boolean;
};

export function CardPaymentForm({
  total,
  withInstallments,
}: CardPaymentFormProps) {
  return (
    <div className='flex flex-col gap-5'>
      {withInstallments && (
        <SelectField label='Parcelas'>
          {getInstallments(total).map(({ count, value }) => (
            <option key={count} value={count}>
              {count}x de {formatMoney(value)}
              {count === 1 ? ' (sem juros)' : ''}
            </option>
          ))}
        </SelectField>
      )}

      <TextField
        label='Número do cartão'
        inputMode='numeric'
        autoComplete='cc-number'
        placeholder='0000 0000 0000 0000'
        maxLength={19}
      />
      <TextField label='Nome do titular' autoComplete='cc-name' />

      <div className='grid grid-cols-3 gap-4'>
        <SelectField label='Mês' autoComplete='cc-exp-month'>
          {MONTHS.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </SelectField>
        <SelectField label='Ano' autoComplete='cc-exp-year'>
          {getYears().map((year) => (
            <option key={year}>{year}</option>
          ))}
        </SelectField>
        <TextField
          label='CVV'
          inputMode='numeric'
          autoComplete='cc-csc'
          placeholder='000'
          maxLength={4}
        />
      </div>
    </div>
  );
}
