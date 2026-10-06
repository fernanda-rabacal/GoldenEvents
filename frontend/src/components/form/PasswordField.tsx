'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Button } from '@/ui/button';
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
        <span className='absolute top-1/2 right-2 -translate-y-1/2'>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            onClick={() => setIsVisible((visible) => !visible)}
            className='text-muted-foreground'
          >
            {isVisible ? <EyeOff /> : <Eye />}
          </Button>
        </span>
      }
    />
  );
}
