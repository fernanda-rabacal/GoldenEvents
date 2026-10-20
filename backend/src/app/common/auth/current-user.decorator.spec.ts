import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { CurrentUser } from './current-user.decorator.js';
import { UnauthorizedError } from '../errors/types/unauthorized.error.js';

function currentUserFactory() {
  class Controller {
    handler(@CurrentUser() requester: unknown) {
      return requester;
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Controller, 'handler');

  return Object.values<{ factory: (data: unknown, ctx: ExecutionContext) => unknown }>(
    args,
  )[0].factory;
}

function contextWith(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as ExecutionContext;
}

describe('CurrentUser', () => {
  const factory = currentUserFactory();

  it('should return only the id and user type of the authenticated user', () => {
    const user = { id: 3, user_type_id: 2, email: 'ana@email.com', active: true };

    expect(factory(undefined, contextWith(user))).toStrictEqual({
      id: 3,
      user_type_id: 2,
    });
  });

  it('should throw an UnauthorizedError when the route has no JwtAuthGuard', () => {
    expect(() => factory(undefined, contextWith(undefined))).toThrow(UnauthorizedError);
  });
});
