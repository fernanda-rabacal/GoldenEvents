'use client';

import { useState } from 'react';
import type { OrganizerAudienceMember } from '@golden-events/shared';
import { formatCheckIns } from '@/utils/audience';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import { formatTicketCount } from '@/utils/orders';
import { getInitials } from '@/utils/user_profile';
import { AudienceMemberDialog } from './AudienceMemberDialog';

type AudienceTableProps = {
  members: OrganizerAudienceMember[];
};

export function AudienceTable({ members }: AudienceTableProps) {
  const [selected, setSelected] = useState<OrganizerAudienceMember | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  function openMember(member: OrganizerAudienceMember) {
    setSelected(member);
    setOpen(true);
  }

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-3xl text-left text-body-sm'>
          <thead className='border-b border-border text-caption font-bold tracking-wide text-muted-foreground uppercase'>
            <tr>
              <th className='py-3 pr-4 font-bold'>Pessoa</th>
              <th className='px-4 py-3 font-bold'>Eventos</th>
              <th className='px-4 py-3 font-bold'>Ingressos</th>
              <th className='px-4 py-3 font-bold'>Check-in</th>
              <th className='px-4 py-3 font-bold'>Última compra</th>
              <th className='py-3 pl-4 text-right font-bold'>Total gasto</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.buyer.id}
                onClick={() => openMember(member)}
                className='cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background'
              >
                <td className='py-4 pr-4'>
                  <div className='flex items-center gap-3'>
                    <span
                      aria-hidden
                      className='flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-black text-accent-foreground'
                    >
                      {getInitials(member.buyer.name)}
                    </span>
                    <div>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation();
                          openMember(member);
                        }}
                        aria-label={`Ver o histórico de ${member.buyer.name}`}
                        className='rounded text-left font-bold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
                      >
                        {member.buyer.name}
                      </button>
                      <p className='text-caption text-muted-foreground'>
                        {member.buyer.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  <span className='flex items-center gap-2'>
                    {member.events_count}
                    {member.events_count > 1 && (
                      <span className='rounded-full bg-green-100 px-2.5 py-1 text-caption font-bold text-green-600'>
                        Recorrente
                      </span>
                    )}
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatTicketCount(member.tickets_count)}
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatCheckIns(member)}
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatShortDateTime(member.last_purchase_at)}
                </td>
                <td className='py-4 pl-4 text-right font-black whitespace-nowrap text-foreground'>
                  {formatMoney(member.total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AudienceMemberDialog
        member={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
