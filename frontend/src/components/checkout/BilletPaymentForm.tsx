'use client';

import { useState } from 'react';
import { TextField } from '@/components/form/TextField';
import { maskDocument } from '@/utils/masks';

const DOCUMENT_TYPES = {
  cpf: { label: 'CPF', placeholder: '000.000.000-00', maxLength: 14 },
  cnpj: { label: 'CNPJ', placeholder: '00.000.000/0000-00', maxLength: 18 },
};

type DocumentType = keyof typeof DOCUMENT_TYPES;

export function BilletPaymentForm() {
  const [documentType, setDocumentType] = useState<DocumentType>('cpf');
  const [document, setDocument] = useState('');
  const { label, placeholder, maxLength } = DOCUMENT_TYPES[documentType];

  return (
    <div className='flex flex-col gap-5'>
      <TextField label='Gerar no nome de' autoComplete='name' />

      <fieldset className='flex items-center gap-5 text-body-sm font-bold text-foreground/80'>
        <legend className='mb-2'>Tipo do documento</legend>
        {(Object.keys(DOCUMENT_TYPES) as DocumentType[]).map((type) => (
          <label key={type} className='flex cursor-pointer items-center gap-2'>
            <input
              type='radio'
              name='document_type'
              value={type}
              checked={documentType === type}
              onChange={() => {
                setDocumentType(type);
                setDocument('');
              }}
              className='accent-primary'
            />
            {DOCUMENT_TYPES[type].label}
          </label>
        ))}
      </fieldset>

      <TextField
        label={label}
        inputMode='numeric'
        placeholder={placeholder}
        maxLength={maxLength}
        value={document}
        onChange={(event) => setDocument(maskDocument(event.target.value))}
      />
    </div>
  );
}
