export function PixPaymentForm() {
  return (
    <div className='flex flex-col items-center gap-4 rounded-2xl bg-background p-6 text-center'>
      <p className='font-bold text-foreground'>
        Leia este QR Code com o aplicativo do seu banco
      </p>
      <img
        src='/images/qr_code.jpg'
        alt='QR Code para pagamento via Pix'
        className='size-48 rounded-xl'
      />
    </div>
  );
}
