export enum UserTypeEnum {
  ADMIN = 1,
  USER = 2,
  ORGANIZER = 3,
}

export interface User {
  id: number;
  name: string;
  email: string;
  document: string;
  user_type_id: UserTypeEnum;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// O JWT e o cookie expiram juntos
export const SESSION_TTL_SECONDS = {
  default: 60 * 60,
  keepConnected: 60 * 60 * 24 * 30,
};

export const PASSWORD_MIN_LENGTH = 8;

// O bcrypt ignora o que passa de 72 bytes
export const PASSWORD_MAX_LENGTH = 72;

export function canManageEvents(userTypeId: UserTypeEnum) {
  return userTypeId === UserTypeEnum.ADMIN || userTypeId === UserTypeEnum.ORGANIZER;
}
