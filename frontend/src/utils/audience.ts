import type { OrganizerAudienceMember } from '@golden-events/shared';

// "1 de 4": ingressos já usados na portaria
export function formatCheckIns({
  tickets_used,
  tickets_count,
}: Pick<OrganizerAudienceMember, 'tickets_used' | 'tickets_count'>) {
  return tickets_count > 0 ? `${tickets_used} de ${tickets_count}` : '—';
}
