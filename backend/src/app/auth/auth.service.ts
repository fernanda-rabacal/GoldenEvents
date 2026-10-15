import { Injectable } from '@nestjs/common';
import { SESSION_TTL_SECONDS } from '@golden-events/shared';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service.js';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenDto } from './dto/auth-token.dto.js';
import { compareEncrypedData, encryptData } from '../../util/crypt.js';
import {
  RateLimitService,
  type RateLimitRule,
} from '../../shared/rate-limit/rate-limit.service.js';

// Conta só as senhas erradas, por e-mail: protege a conta mesmo quando o atacante troca de IP
export const LOGIN_FAILURES: RateLimitRule = {
  name: 'login-failures',
  limit: 5,
  windowMs: 15 * 60_000,
  message: 'Muitas tentativas de login com senha errada para este e-mail.',
};

@Injectable()
export class AuthService {
  // Comparado quando o e-mail não existe: responder mais rápido entregaria quais e-mails têm conta
  private readonly dummyHash = encryptData(randomUUID());

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async authenticate(email: string, password: string) {
    const subject = email.trim().toLowerCase();

    await this.rateLimit.assertAllowed(LOGIN_FAILURES, subject);

    const user = await this.validateUser(email, password);

    if (user) {
      await this.rateLimit.reset(LOGIN_FAILURES, subject);
    } else {
      await this.rateLimit.recordFailure(LOGIN_FAILURES, subject);
    }

    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    const validPassword = await compareEncrypedData(
      password,
      user?.password ?? (await this.dummyHash),
    );

    if (!user || !user.active || !validPassword) {
      return null;
    }

    return user;
  }

  // Roda a cada requisição autenticada: desativar a conta ou trocar a senha derruba os tokens antigos
  async validateSession({ id, iat }: { id: number; iat: number }) {
    const user = await this.userService.findSession(id);

    if (!user?.active) {
      return null;
    }

    // iat tem precisão de segundos
    if (
      user.password_changed_at &&
      iat < Math.floor(user.password_changed_at.getTime() / 1000)
    ) {
      return null;
    }

    return user;
  }

  createToken({ id, name, email }: AuthTokenDto, keepConnected = false) {
    const authTokenDto: AuthTokenDto = { id, name, email };

    return this.jwtService.sign(authTokenDto, {
      expiresIn: keepConnected
        ? SESSION_TTL_SECONDS.keepConnected
        : SESSION_TTL_SECONDS.default,
    });
  }
}
