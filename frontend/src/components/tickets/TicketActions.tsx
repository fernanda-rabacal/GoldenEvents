'use client';

import { useState } from 'react';
import { Download, QrCode } from 'lucide-react';
import { toastNotify } from '@/lib/toastify';
import type { EventTickets } from '@/services/users';
import { Button } from '@/ui/button';
import { formatDateWithTime } from '@/utils/format_date';
import { downloadTicketImage } from '@/utils/ticket_download';
import { formatTicketCode } from '@/utils/tickets';
import { TicketDialog } from './TicketDialog';

type TicketActionsProps = {
  group: EventTickets;
};

export function TicketActions({ group }: TicketActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { event, tickets } = group;

  async function download(ticketId: number) {
    setDownloadingId(ticketId);

    try {
      await downloadTicketImage({
        code: formatTicketCode(ticketId),
        eventName: event.name,
        date: formatDateWithTime(event.start_date),
        location: event.location,
      });
    } catch {
      toastNotify(
        'error',
        'Não foi possível gerar o ingresso. Tente novamente.',
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <Button
        size='lg'
        className='h-10 rounded-xl px-4 font-bold'
        onClick={() => setIsOpen(true)}
      >
        <QrCode data-icon='inline-start' />
        Ver ingresso
      </Button>
      <Button
        variant='outline'
        size='icon-lg'
        className='rounded-xl'
        aria-label={
          tickets.length === 1 ? 'Baixar ingresso' : 'Baixar ingressos'
        }
        disabled={downloadingId !== null}
        // Com mais de um ingresso, cada um é baixado pelo modal
        onClick={() =>
          tickets.length === 1 ? download(tickets[0].id) : setIsOpen(true)
        }
      >
        <Download className='text-accent-foreground' />
      </Button>

      <TicketDialog
        group={group}
        open={isOpen}
        onOpenChange={setIsOpen}
        onDownload={download}
        downloadingId={downloadingId}
      />
    </>
  );
}
