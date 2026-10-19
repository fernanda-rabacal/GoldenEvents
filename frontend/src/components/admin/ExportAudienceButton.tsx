'use client';

import { useTransition } from 'react';
import { Download } from 'lucide-react';
import type { AudienceSegment } from '@golden-events/shared';
import { toastNotify } from '@/lib/toastify';
import { fetchAudienceForExport } from '@/services/audience-actions';
import { Button } from '@/ui/button';
import { formatCheckIns } from '@/utils/audience';
import { downloadCsv } from '@/utils/csv';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';

type ExportAudienceButtonProps = {
  eventId?: number;
  search?: string;
  segment?: AudienceSegment;
  disabled: boolean;
};

export function ExportAudienceButton({
  disabled,
  ...filters
}: ExportAudienceButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await fetchAudienceForExport(filters);

      if (!result.success) {
        toastNotify('error', result.message);
        return;
      }

      downloadCsv(
        'publico.csv',
        [
          'Nome',
          'E-mail',
          'Eventos',
          'Pedidos',
          'Ingressos',
          'Check-in',
          'Total gasto',
          'Primeira compra',
          'Última compra',
        ],
        result.data.map((member) => [
          member.buyer.name,
          member.buyer.email,
          member.events_count,
          member.orders_count,
          member.tickets_count,
          formatCheckIns(member),
          formatMoney(member.total_cents),
          formatShortDateTime(member.first_purchase_at),
          formatShortDateTime(member.last_purchase_at),
        ]),
      );
    });
  }

  return (
    <Button
      variant='outline'
      disabled={disabled || isPending}
      onClick={handleExport}
    >
      <Download data-icon='inline-start' />
      {isPending ? 'Exportando…' : 'Exportar CSV'}
    </Button>
  );
}
