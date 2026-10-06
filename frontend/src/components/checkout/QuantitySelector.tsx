import { Minus, Plus } from 'lucide-react';
import { Button } from '@/ui/button';

type QuantitySelectorProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({
  value,
  max,
  onChange,
}: QuantitySelectorProps) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <p className='text-body-sm font-bold text-foreground'>Quantidade</p>
      <div className='flex items-center gap-3'>
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          aria-label='Diminuir quantidade'
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          <Minus />
        </Button>
        <span aria-live='polite' className='w-6 text-center font-bold'>
          {value}
        </span>
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          aria-label='Aumentar quantidade'
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
