// Entradas dos casos de uso de usuários; os DTOs HTTP implementam estes tipos
export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  document: string;
  isOrganizer?: boolean;
};

export type UserChanges = { name?: string; userTypeId?: number; password?: string };

export type UpdateUserInput = UserChanges & { currentPassword?: string };
