'use client';

import QRCode from 'qrcode';

type TicketQrCodeProps = {
  code: string;
  size: number;
};

export function TicketQrCode({ code, size }: TicketQrCodeProps) {
  return (
    <canvas
      role='img'
      aria-label={`QR code do ingresso ${code}`}
      width={size}
      height={size}
      className='rounded-lg'
      ref={(canvas) => {
        if (canvas) {
          QRCode.toCanvas(canvas, code, { width: size, margin: 1 });
        }
      }}
    />
  );
}
