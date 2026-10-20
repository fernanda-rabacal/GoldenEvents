import { UserTypeEnum } from '@golden-events/shared';
import type { Requester } from './requester.js';
import { ForbiddenError } from '../errors/types/ForbiddenError.js';

export function isAdmin(requester: Requester) {
  return requester.user_type_id === UserTypeEnum.ADMIN;
}

export function assertAdmin(requester: Requester) {
  if (!isAdmin(requester)) {
    throw new ForbiddenError('Somente administradores podem fazer isso.');
  }
}
