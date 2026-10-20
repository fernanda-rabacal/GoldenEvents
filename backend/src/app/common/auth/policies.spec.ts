import { UserTypeEnum } from '@golden-events/shared';
import { assertAdmin, isAdmin } from './policies.js';
import { ForbiddenError } from '../errors/types/forbidden.error.js';

describe('policies', () => {
  const admin = { id: 1, user_type_id: UserTypeEnum.ADMIN };
  const organizer = { id: 2, user_type_id: UserTypeEnum.ORGANIZER };

  it('should only treat the admin type as admin', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(organizer)).toBe(false);
  });

  it('should throw a ForbiddenError for anyone but an admin', () => {
    expect(() => assertAdmin(admin)).not.toThrow();
    expect(() => assertAdmin(organizer)).toThrow(ForbiddenError);
  });
});
