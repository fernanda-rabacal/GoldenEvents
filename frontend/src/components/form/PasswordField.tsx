'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'icon' | 'trailing'>;

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      label={label}
      type={isVisible ? 'text' : 'password'}
      icon={LockKeyhole}
      trailing={
        <button
          type='button'
          aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          onClick={() => setIsVisible((visible) => !visible)}
          className='absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground/60 hover:text-accent-foreground'
        >
          {isVisible ? (
            <EyeOff className='size-4' />
          ) : (
            <Eye className='size-4' />
          )}
        </button>
      }
    />
  );
}
