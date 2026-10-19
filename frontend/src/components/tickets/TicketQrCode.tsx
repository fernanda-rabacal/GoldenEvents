'use client';

import QRCode from 'qrcode';

type TicketQrCodeProps = {
  code: string;
  size: number;
  label?: string;
};

export function TicketQrCode({
  code,
  size,
  label = `QR code do ingresso ${code}`,
}: TicketQrCodeProps) {
  return (
    <canvas
      role='img'
      aria-label={label}
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
