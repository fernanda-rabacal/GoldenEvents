'use client';

import { useState } from 'react';
import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';
import type { CardData } from '@/lib/card-token';
import { maskCardNumber } from '@/utils/masks';

const CARD_FIELDS = {
  number: 'card_number',
  holder: 'card_holder',
  month: 'card_month',
  year: 'card_year',
  cvv: 'card_cvv',
};

export function readCardData(form: HTMLFormElement): CardData {
  const formData = new FormData(form);
  const field = (name: string) => String(formData.get(name) ?? '');

  return {
    number: field(CARD_FIELDS.number),
    month: field(CARD_FIELDS.month),
    year: field(CARD_FIELDS.year),
    cvv: field(CARD_FIELDS.cvv),
  };
}

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);

function getYears() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 11 }, (_, index) => currentYear + index);
}

export function CardPaymentForm() {
  const [number, setNumber] = useState('');

  return (
    <div className='flex flex-col gap-5'>
      <TextField
        label='Número do cartão'
        name={CARD_FIELDS.number}
        inputMode='numeric'
        autoComplete='cc-number'
        placeholder='0000 0000 0000 0000'
        maxLength={23}
        required
        value={number}
        onChange={(event) => setNumber(maskCardNumber(event.target.value))}
      />
      <TextField
        label='Nome do titular'
        name={CARD_FIELDS.holder}
        autoComplete='cc-name'
        required
      />

      <div className='grid grid-cols-3 gap-4'>
        <SelectField
          label='Mês'
          name={CARD_FIELDS.month}
          autoComplete='cc-exp-month'
        >
          {MONTHS.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </SelectField>
        <SelectField
          label='Ano'
          name={CARD_FIELDS.year}
          autoComplete='cc-exp-year'
        >
          {getYears().map((year) => (
            <option key={year}>{year}</option>
          ))}
        </SelectField>
        <TextField
          label='CVV'
          name={CARD_FIELDS.cvv}
          inputMode='numeric'
          autoComplete='cc-csc'
          placeholder='000'
          maxLength={4}
          required
        />
      </div>
    </div>
  );
}
