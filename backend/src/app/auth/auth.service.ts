import { Injectable } from '@nestjs/common';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@golden-events/shared';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { UserService } from '../user/index.js';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenDto } from './dto/auth-token.dto.js';
import { compareEncrypedData, encryptData } from '../../util/crypt.js';
import {
  RateLimitService,
  type RateLimitRule,
} from '../../shared/rate-limit/rate-limit.service.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { UnauthorizedError } from '../common/errors/types/UnauthorizedError.js';

// Conta só as senhas erradas, por e-mail: protege a conta mesmo quando o atacante troca de IP
export const LOGIN_FAILURES: RateLimitRule = {
  name: 'login-failures',
  limit: 5,
  windowMs: 15 * 60_000,
  message: 'Muitas tentativas de login com senha errada para este e-mail.',
};

// Requisições paralelas do navegador renovam com o mesmo token; só depois disso o reuso indica roubo
export const REFRESH_REUSE_GRACE_MS = 30_000;

const SESSION_EXPIRED = 'Sua sessão expirou. Entre novamente.';

export type Session = { token: string; refreshToken: string; keepConnected: boolean };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function refreshExpiration(keepConnected: boolean, now: Date) {
  const ttl = keepConnected
    ? REFRESH_TOKEN_TTL_SECONDS.keepConnected
    : REFRESH_TOKEN_TTL_SECONDS.default;

  return new Date(now.getTime() + ttl * 1000);
}

@Injectable()
export class AuthService {
  // Comparado quando o e-mail não existe: responder mais rápido entregaria quais e-mails têm conta
  private readonly dummyHash = encryptData(randomUUID());

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly rateLimit: RateLimitService,
    private readonly refreshTokens: RefreshTokenRepository,
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

  createToken({ id, name, email }: AuthTokenDto) {
    const authTokenDto: AuthTokenDto = { id, name, email };

    return this.jwtService.sign(authTokenDto, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }

  async startSession(user: AuthTokenDto, keepConnected = false, now = new Date()) {
    await this.refreshTokens.deleteExpired(user.id, now);

    return this.issueSession(user, randomUUID(), keepConnected, now);
  }

  async refresh(refreshToken: string, now = new Date()): Promise<Session> {
    const stored = await this.refreshTokens.findByHash(hashToken(refreshToken));

    if (!stored || stored.expires_at <= now) {
      throw new UnauthorizedError(SESSION_EXPIRED);
    }

    if (
      stored.rotated_at &&
      now.getTime() - stored.rotated_at.getTime() > REFRESH_REUSE_GRACE_MS
    ) {
      await this.refreshTokens.deleteFamily(stored.family_id);
      throw new UnauthorizedError(SESSION_EXPIRED);
    }

    const user = await this.userService.findSession(stored.user_id);

    if (!user?.active) {
      await this.refreshTokens.deleteFamily(stored.family_id);
      throw new UnauthorizedError(SESSION_EXPIRED);
    }

    await this.refreshTokens.markRotated(stored.id, now);

    return this.issueSession(user, stored.family_id, stored.keep_connected, now);
  }

  // Apaga em vez de marcar: um token marcado ainda passaria pela tolerância de REFRESH_REUSE_GRACE_MS
  async logout(refreshToken: string) {
    const stored = await this.refreshTokens.findByHash(hashToken(refreshToken));

    if (stored) {
      await this.refreshTokens.deleteFamily(stored.family_id);
    }
  }

  private async issueSession(
    user: AuthTokenDto,
    familyId: string,
    keepConnected: boolean,
    now: Date,
  ): Promise<Session> {
    const refreshToken = randomBytes(32).toString('base64url');

    await this.refreshTokens.create({
      user_id: user.id,
      family_id: familyId,
      token_hash: hashToken(refreshToken),
      keep_connected: keepConnected,
      expires_at: refreshExpiration(keepConnected, now),
    });

    return { token: this.createToken(user), refreshToken, keepConnected };
  }
}
