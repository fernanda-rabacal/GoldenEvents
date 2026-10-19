import { QrCode } from 'lucide-react';

export function PixPaymentForm() {
  return (
    <div className='flex items-start gap-4 rounded-2xl bg-background p-6'>
      <QrCode className='mt-0.5 size-6 shrink-0 text-orange-500' />
      <p className='text-body-sm text-muted-foreground'>
        Ao confirmar a compra, geramos um QR Code Pix para você pagar pelo
        aplicativo do seu banco. A confirmação chega em poucos segundos.
      </p>
    </div>
  );
}
