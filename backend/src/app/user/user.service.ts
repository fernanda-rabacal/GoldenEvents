import { Injectable } from '@nestjs/common';
import type { CreateUserInput, UpdateUserInput } from './user-inputs.js';
import { UserRepository } from './repositories/user.repository.js';
import { BusinessRuleError } from '../common/errors/types/business-rule.error.js';
import { ForbiddenError } from '../common/errors/types/forbidden.error.js';
import { NotFoundError } from '../common/errors/types/not-found.error.js';
import type { Requester } from '../common/auth/requester.js';
import { assertAdmin, isAdmin } from '../common/auth/policies.js';
import { UserTypeEnum } from '@golden-events/shared';
import { compareEncrypedData } from '../common/utils/crypt.util.js';
import {
  RateLimitService,
  type RateLimitRule,
} from '../../shared/rate-limit/rate-limit.service.js';

// Com um token roubado, a senha atual é a última barreira: não pode ser adivinhada à vontade
export const CURRENT_PASSWORD_FAILURES: RateLimitRule = {
  name: 'current-password-failures',
  limit: 5,
  windowMs: 15 * 60_000,
  message: 'Muitas tentativas com a senha atual errada.',
};

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly rateLimit: RateLimitService,
  ) {}

  async create(input: CreateUserInput) {
    return this.repository.create(input);
  }

  // Devolve e-mail e CPF de todo mundo: só para administradores
  async findAll(requester: Requester) {
    assertAdmin(requester);

    return this.repository.findAll();
  }

  async findSession(id: number) {
    return this.repository.findSession(id);
  }

  async findById(id: number) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return user;
  }

  // Retorna null quando não encontra: o login trata e responde com credenciais inválidas
  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  // Nome e e-mail dos compradores, para quem vende: sem CPF nem tipo de conta
  async findContacts(ids: number[]) {
    return this.repository.findContacts(ids);
  }

  async findIdsMatching(term: string, take = 200) {
    return this.repository.findIdsMatching(term, take);
  }

  async getUserTypes() {
    return this.repository.getUserTypes();
  }

  assertCanAccessUser(requester: Requester, userId: number) {
    if (requester.id !== userId && !isAdmin(requester)) {
      throw new ForbiddenError('Você só pode acessar o seu próprio perfil.');
    }
  }

  async findProfile(requester: Requester, userId: number) {
    this.assertCanAccessUser(requester, userId);

    return this.findById(userId);
  }

  async update(requester: Requester, userId: number, input: UpdateUserInput) {
    this.assertCanAccessUser(requester, userId);

    if (input.userTypeId === UserTypeEnum.ADMIN && !isAdmin(requester)) {
      throw new ForbiddenError(
        'Somente administradores podem conceder o perfil de administrador.',
      );
    }

    if (input.password !== undefined) {
      await this.assertCurrentPassword(requester, userId, input.currentPassword);
    }

    return this.repository.update(userId, input);
  }

  async toggleActiveUser(requester: Requester, id: number) {
    assertAdmin(requester);

    if (requester.id === id) {
      throw new BusinessRuleError('Você não pode desativar a sua própria conta.');
    }

    const user = await this.findById(id);

    return this.repository.toggleActiveUser(id, !user.active);
  }

  private async assertCurrentPassword(
    requester: Requester,
    userId: number,
    currentPassword: string,
  ) {
    if (requester.id !== userId) {
      throw new ForbiddenError('Só o próprio usuário pode trocar a senha.');
    }

    const subject = `user:${userId}`;

    await this.rateLimit.assertAllowed(CURRENT_PASSWORD_FAILURES, subject);

    const hash = await this.repository.findPasswordHash(userId);

    if (!hash || !(await compareEncrypedData(currentPassword, hash))) {
      await this.rateLimit.recordFailure(CURRENT_PASSWORD_FAILURES, subject);
      throw new BusinessRuleError('A senha atual está incorreta.');
    }
  }
}
