'use client';

import { Copy, LoaderCircle } from 'lucide-react';
import type { Charge } from '@golden-events/shared';
import { TicketQrCode } from '@/components/tickets/TicketQrCode';
import { toastNotify } from '@/lib/toastify';
import { Button } from '@/ui/button';
import { formatTime } from '@/utils/format_date';

type PixChargePanelProps = {
  charge: Charge;
  onChangeMethod: () => void;
  onSimulatePayment?: () => void;
};

export function PixChargePanel({
  charge,
  onChangeMethod,
  onSimulatePayment,
}: PixChargePanelProps) {
  const code = charge.pix_qr_code ?? '';

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    toastNotify('success', 'Código Pix copiado!');
  }

  return (
    <div className='flex flex-col items-center gap-5 rounded-2xl bg-background p-6 text-center'>
      <p className='font-bold text-foreground'>
        Leia este QR Code com o aplicativo do seu banco
      </p>
      <TicketQrCode
        code={code}
        size={192}
        label='QR Code para pagamento via Pix'
      />

      <div className='flex w-full flex-col gap-2 text-left'>
        <label
          htmlFor='pix-code'
          className='text-body-sm font-bold text-foreground/80'
        >
          Ou use o Pix copia e cola
        </label>
        <div className='flex gap-2'>
          <input
            id='pix-code'
            readOnly
            value={code}
            onFocus={(event) => event.target.select()}
            className='min-w-0 flex-1 truncate rounded-2xl border border-input bg-card px-4 py-3 text-body-sm text-foreground outline-none'
          />
          <Button
            type='button'
            size='lg'
            className='h-auto'
            onClick={handleCopy}
          >
            <Copy /> Copiar
          </Button>
        </div>
        {charge.expires_at && (
          <p className='text-caption text-muted-foreground'>
            O código vale até as {formatTime(charge.expires_at)}.
          </p>
        )}
      </div>

      <p
        aria-live='polite'
        className='flex items-center gap-2 text-body-sm font-bold text-muted-foreground'
      >
        <LoaderCircle className='size-4 animate-spin' />
        Aguardando a confirmação do pagamento...
      </p>

      <div className='flex flex-col items-center gap-1'>
        {onSimulatePayment && (
          <Button type='button' variant='outline' onClick={onSimulatePayment}>
            Simular pagamento (ambiente de testes)
          </Button>
        )}
        <Button type='button' variant='link' onClick={onChangeMethod}>
          Escolher outra forma de pagamento
        </Button>
      </div>
    </div>
  );
}
