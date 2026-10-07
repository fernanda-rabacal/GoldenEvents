import { UserTypeEnum } from '@golden-events/shared';

export const USER_TYPE_LABELS: Record<UserTypeEnum, string> = {
  [UserTypeEnum.ADMIN]: 'Administrador(a)',
  [UserTypeEnum.USER]: 'Participante',
  [UserTypeEnum.ORGANIZER]: 'Organizador(a)',
};

// "Fernanda Rabaçal" -> "FR"
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

  return `${first}${last}`.toUpperCase();
}
