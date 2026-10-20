import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuthService, LOGIN_FAILURES } from './auth.service.js';
import { UserService } from '../user/index.js';
import { encryptData } from '../../util/crypt.js';
import { TooManyRequestsError } from '../common/errors/types/TooManyRequestsError.js';
import { RateLimitService } from '../../shared/rate-limit/rate-limit.service.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { UnauthorizedError } from '../common/errors/types/UnauthorizedError.js';

describe('AuthService', () => {
  let service: AuthService;
  let userService: DeepMockProxy<UserService>;
  let rateLimit: DeepMockProxy<RateLimitService>;
  let jwt: DeepMockProxy<JwtService>;
  let refreshTokens: DeepMockProxy<RefreshTokenRepository>;
  let storedUser: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: UserService, useValue: mockDeep<UserService>() },
        { provide: RateLimitService, useValue: mockDeep<RateLimitService>() },
        { provide: RefreshTokenRepository, useValue: mockDeep<RefreshTokenRepository>() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    rateLimit = module.get(RateLimitService);
    jwt = module.get(JwtService);
    refreshTokens = module.get(RefreshTokenRepository);

    storedUser = {
      id: 1,
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456'),
      active: true,
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate an user with the correct password', async () => {
    userService.findByEmail.mockResolvedValueOnce(storedUser);

    const user = await service.validateUser('emailteste@email.com', '123456');

    expect(user).toStrictEqual(storedUser);
  });

  it('should not validate an user with a wrong password', async () => {
    userService.findByEmail.mockResolvedValueOnce(storedUser);

    const user = await service.validateUser('emailteste@email.com', 'senha-errada');

    expect(user).toBeNull();
  });

  it('should not validate an inexistent user', async () => {
    userService.findByEmail.mockResolvedValueOnce(null);

    const user = await service.validateUser('wrongemail@email.com', '123456');

    expect(user).toBeNull();
  });

  it('should not validate a deactivated user, even with the correct password', async () => {
    userService.findByEmail.mockResolvedValueOnce({ ...storedUser, active: false });

    const user = await service.validateUser('emailteste@email.com', '123456');

    expect(user).toBeNull();
  });

  it('should sign a 15 minutes access token', () => {
    service.createToken(storedUser);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 1, name: 'Teste usuário', email: 'emailteste@email.com' },
      { expiresIn: 15 * 60 },
    );
  });

  describe('sessions', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    const DAY_MS = 86_400_000;
    const activeUser = {
      id: 1,
      name: 'Teste',
      email: 'teste@email.com',
      user_type_id: 2,
      active: true,
      password_changed_at: null,
    };

    function storedToken(overrides = {}) {
      return {
        id: 'token-1',
        user_id: 1,
        family_id: 'family-1',
        token_hash: 'hash',
        keep_connected: true,
        expires_at: new Date(now.getTime() + DAY_MS),
        rotated_at: null,
        created_at: now,
        ...overrides,
      };
    }

    beforeEach(() => {
      jwt.sign.mockReturnValue('access-token');
    });

    it('should start a session with a 1 day refresh token, or a 30 days one to keep connected', async () => {
      await service.startSession(storedUser, false, now);
      const kept = await service.startSession(storedUser, true, now);

      expect(refreshTokens.deleteExpired).toHaveBeenCalledWith(1, now);
      expect(refreshTokens.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          user_id: 1,
          keep_connected: false,
          expires_at: new Date(now.getTime() + DAY_MS),
        }),
      );
      expect(refreshTokens.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          keep_connected: true,
          expires_at: new Date(now.getTime() + 30 * DAY_MS),
        }),
      );
      expect(kept).toEqual({
        token: 'access-token',
        refreshToken: expect.any(String),
        keepConnected: true,
      });
      // Só o hash vai para o banco
      expect(refreshTokens.create.mock.calls[1][0].token_hash).not.toBe(
        kept.refreshToken,
      );
    });

    it('should use a new family on each login', async () => {
      await service.startSession(storedUser, false, now);
      await service.startSession(storedUser, false, now);

      const [first, second] = refreshTokens.create.mock.calls.map(
        ([data]) => data.family_id,
      );
      expect(first).not.toBe(second);
    });

    it('should rotate the refresh token and push the expiration forward', async () => {
      const later = new Date(now.getTime() + 10 * DAY_MS);
      refreshTokens.findByHash.mockResolvedValueOnce(
        storedToken({ expires_at: new Date(later.getTime() + DAY_MS) }),
      );
      userService.findSession.mockResolvedValueOnce(activeUser);

      const session = await service.refresh('refresh-token', later);

      expect(refreshTokens.markRotated).toHaveBeenCalledWith('token-1', later);
      expect(refreshTokens.create).toHaveBeenCalledWith(
        expect.objectContaining({
          family_id: 'family-1',
          keep_connected: true,
          expires_at: new Date(later.getTime() + 30 * DAY_MS),
        }),
      );
      expect(session.keepConnected).toBe(true);
    });

    it('should reject an unknown or expired refresh token', async () => {
      refreshTokens.findByHash.mockResolvedValueOnce(null);
      await expect(service.refresh('desconhecido', now)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      refreshTokens.findByHash.mockResolvedValueOnce(storedToken({ expires_at: now }));
      await expect(service.refresh('vencido', now)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(refreshTokens.create).not.toHaveBeenCalled();
    });

    it('should accept a token rotated moments ago by a parallel request', async () => {
      refreshTokens.findByHash.mockResolvedValueOnce(
        storedToken({ rotated_at: new Date(now.getTime() - 5_000) }),
      );
      userService.findSession.mockResolvedValueOnce(activeUser);

      await service.refresh('refresh-token', now);

      expect(refreshTokens.deleteFamily).not.toHaveBeenCalled();
      expect(refreshTokens.create).toHaveBeenCalled();
    });

    it('should end the whole session when an old refresh token is reused', async () => {
      refreshTokens.findByHash.mockResolvedValueOnce(
        storedToken({ rotated_at: new Date(now.getTime() - 60_000) }),
      );

      await expect(service.refresh('roubado', now)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(refreshTokens.deleteFamily).toHaveBeenCalledWith('family-1');
      expect(refreshTokens.create).not.toHaveBeenCalled();
    });

    it('should not refresh the session of a deactivated user', async () => {
      refreshTokens.findByHash.mockResolvedValueOnce(storedToken());
      userService.findSession.mockResolvedValueOnce({ ...activeUser, active: false });

      await expect(service.refresh('refresh-token', now)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(refreshTokens.deleteFamily).toHaveBeenCalledWith('family-1');
    });

    it('should end the session on logout, and ignore an unknown token', async () => {
      refreshTokens.findByHash.mockResolvedValueOnce(storedToken());
      await service.logout('refresh-token');
      expect(refreshTokens.deleteFamily).toHaveBeenCalledWith('family-1');

      refreshTokens.findByHash.mockResolvedValueOnce(null);
      await expect(service.logout('desconhecido')).resolves.toBeUndefined();
    });
  });

  describe('validateSession', () => {
    const session = { id: 1, name: 'Teste', email: 'teste@email.com', user_type_id: 2 };
    const iat = Math.floor(Date.now() / 1000);

    it('should accept the token of an active user', async () => {
      userService.findSession.mockResolvedValueOnce({
        ...session,
        active: true,
        password_changed_at: null,
      });

      await expect(service.validateSession({ id: 1, iat })).resolves.toEqual(
        expect.objectContaining({ id: 1 }),
      );
    });

    it('should reject the token of a deactivated user', async () => {
      userService.findSession.mockResolvedValueOnce({
        ...session,
        active: false,
        password_changed_at: null,
      });

      await expect(service.validateSession({ id: 1, iat })).resolves.toBeNull();
    });

    it('should reject a token issued before the password changed', async () => {
      userService.findSession.mockResolvedValueOnce({
        ...session,
        active: true,
        password_changed_at: new Date((iat + 5) * 1000),
      });

      await expect(service.validateSession({ id: 1, iat })).resolves.toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should count a wrong password against the normalized email', async () => {
      userService.findByEmail.mockResolvedValueOnce(storedUser);

      const user = await service.authenticate(' EmailTeste@email.com ', 'senha-errada');

      expect(user).toBeNull();
      expect(rateLimit.recordFailure).toHaveBeenCalledWith(
        LOGIN_FAILURES,
        'emailteste@email.com',
      );
      expect(rateLimit.reset).not.toHaveBeenCalled();
    });

    it('should clear the failures after a successful login', async () => {
      userService.findByEmail.mockResolvedValueOnce(storedUser);

      const user = await service.authenticate('emailteste@email.com', '123456');

      expect(user).toStrictEqual(storedUser);
      expect(rateLimit.reset).toHaveBeenCalledWith(
        LOGIN_FAILURES,
        'emailteste@email.com',
      );
      expect(rateLimit.recordFailure).not.toHaveBeenCalled();
    });

    it('should not check the password of a blocked email', async () => {
      rateLimit.assertAllowed.mockRejectedValueOnce(
        new TooManyRequestsError('Muitas tentativas.', 600),
      );

      await expect(
        service.authenticate('emailteste@email.com', '123456'),
      ).rejects.toBeInstanceOf(TooManyRequestsError);
      expect(userService.findByEmail).not.toHaveBeenCalled();
    });
  });
});
