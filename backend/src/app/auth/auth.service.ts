import { Injectable } from '@nestjs/common';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@golden-events/shared';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { UserService } from '../user/index.js';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token-payload.js';
import { compareEncrypedData, encryptData } from '../common/utils/crypt.util.js';
import {
  RateLimitService,
  type RateLimitRule,
} from '../../shared/rate-limit/rate-limit.service.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { UnauthorizedError } from '../common/errors/types/unauthorized.error.js';
import { GoogleIdentityClient } from './google/google-identity.client.js';

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

// Assinado com o mesmo segredo do access token: a audience impede que um vire o outro
const GOOGLE_SIGNUP_AUDIENCE = 'google-signup';
const GOOGLE_SIGNUP_TTL_SECONDS = 10 * 60;

export type Session = { token: string; refreshToken: string; keepConnected: boolean };

type GoogleSignupClaims = {
  googleId: string;
  email: string;
  name: string;
  keepConnected: boolean;
};

export type GoogleLoginResult =
  { session: Session } | { signupToken: string; name: string; email: string };

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
    private readonly google: GoogleIdentityClient,
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
    // Outros tokens assinados com o mesmo segredo, como o de cadastro pelo Google, não têm id
    if (typeof id !== 'number') {
      return null;
    }

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

  createToken({ id, name, email }: TokenPayload) {
    const payload: TokenPayload = { id, name, email };

    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }

  async startSession(user: TokenPayload, keepConnected = false, now = new Date()) {
    await this.refreshTokens.deleteExpired(user.id, now);

    return this.issueSession(user, randomUUID(), keepConnected, now);
  }

  // Só confia em e-mail verificado pelo Google: é ele que liga a conta Google a uma conta com senha
  async loginWithGoogle(
    code: string,
    codeVerifier: string,
    keepConnected = false,
  ): Promise<GoogleLoginResult> {
    const profile = await this.google.exchangeCode(code, codeVerifier);

    if (!profile.emailVerified) {
      throw new UnauthorizedError('O e-mail desta conta Google não foi verificado.');
    }

    const linked = await this.userService.findByGoogleId(profile.googleId);

    if (linked) {
      return { session: await this.startGoogleSession(linked, keepConnected) };
    }

    const existing = await this.userService.findByEmail(profile.email);

    if (!existing) {
      const claims: GoogleSignupClaims = {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        keepConnected,
      };
      const signupToken = this.jwtService.sign(claims, {
        audience: GOOGLE_SIGNUP_AUDIENCE,
        expiresIn: GOOGLE_SIGNUP_TTL_SECONDS,
      });

      return { signupToken, name: profile.name, email: profile.email };
    }

    if (existing.google_id) {
      throw new UnauthorizedError('Este e-mail já está ligado a outra conta Google.');
    }

    const session = await this.startGoogleSession(existing, keepConnected);

    await this.userService.linkGoogleAccount(existing.id, profile.googleId);

    return { session };
  }

  async completeGoogleSignup(
    signupToken: string,
    document: string,
    isOrganizer = false,
  ): Promise<Session> {
    let claims: GoogleSignupClaims;

    try {
      claims = this.jwtService.verify<GoogleSignupClaims>(signupToken, {
        audience: GOOGLE_SIGNUP_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedError(
        'O tempo para concluir o cadastro acabou. Entre com o Google de novo.',
      );
    }

    const user = await this.userService.createFromGoogle({
      name: claims.name,
      email: claims.email,
      googleId: claims.googleId,
      document,
      isOrganizer,
    });

    return this.startSession(user, claims.keepConnected);
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

  private async startGoogleSession(
    user: TokenPayload & { active: boolean },
    keepConnected: boolean,
  ) {
    if (!user.active) {
      throw new UnauthorizedError('Esta conta está desativada.');
    }

    return this.startSession(user, keepConnected);
  }

  private async issueSession(
    user: TokenPayload,
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
