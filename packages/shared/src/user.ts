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
