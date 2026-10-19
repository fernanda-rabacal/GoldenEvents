'use client';

import { Dialog } from '@base-ui/react/dialog';
import { CalendarDays, Download, MapPin, X } from 'lucide-react';
import type { EventTickets } from '@/services/users';
import { Button, buttonVariants } from '@/ui/button';
import { formatDateWithTime } from '@/utils/format_date';
import { formatTicketCode } from '@/utils/tickets';
import { TicketQrCode } from './TicketQrCode';

type TicketDialogProps = {
  group: EventTickets;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (ticketId: number) => void;
  downloadingId: number | null;
};

export function TicketDialog({
  group: { event, tickets },
  open,
  onOpenChange,
  onDownload,
  downloadingId,
}: TicketDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className='fixed inset-0 z-50 min-h-dvh bg-foreground/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
        <Dialog.Popup className='fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-md max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-xl transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0'>
          <div className='relative bg-primary px-6 py-6 text-primary-foreground'>
            <p className='text-caption font-bold tracking-eyebrow text-secondary uppercase'>
              {tickets.length === 1
                ? 'Seu ingresso'
                : `${tickets.length} ingressos`}
            </p>
            <Dialog.Title className='mt-2 pr-8 text-h4'>
              {event.name}
            </Dialog.Title>
            <Dialog.Description className='mt-3 flex flex-col gap-1 text-body-sm text-primary-foreground/80'>
              <span className='flex items-center gap-2'>
                <CalendarDays className='size-4' />
                {formatDateWithTime(event.start_date)}
              </span>
              <span className='flex items-center gap-2'>
                <MapPin className='size-4' />
                {event.location}
              </span>
            </Dialog.Description>
            <Dialog.Close
              aria-label='Fechar'
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className:
                  'absolute top-4 right-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
              })}
            >
              <X />
            </Dialog.Close>
          </div>

          <ul className='flex flex-col divide-y divide-border overflow-y-auto px-6'>
            {tickets.map(({ id, lot }, index) => {
              const code = formatTicketCode(id);

              return (
                <li key={id} className='flex flex-col items-center gap-3 py-6'>
                  {tickets.length > 1 && (
                    <p className='text-caption font-bold tracking-wide text-muted-foreground uppercase'>
                      Ingresso {index + 1} de {tickets.length}
                    </p>
                  )}
                  <TicketQrCode code={code} size={200} />
                  <p className='text-h4 text-foreground'>{code}</p>
                  <p className='-mt-2 text-body-sm text-muted-foreground'>
                    {lot.sector.name} · {lot.name}
                  </p>
                  <Button
                    variant='outline'
                    size='lg'
                    disabled={downloadingId === id}
                    onClick={() => onDownload(id)}
                  >
                    <Download data-icon='inline-start' />
                    {downloadingId === id ? 'Gerando...' : 'Baixar ingresso'}
                  </Button>
                </li>
              );
            })}
          </ul>

          <p className='border-t border-border bg-background px-6 py-4 text-center text-caption text-muted-foreground'>
            Apresente o QR code na entrada do evento.
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
