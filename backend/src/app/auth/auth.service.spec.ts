import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuthService, LOGIN_FAILURES } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { encryptData } from '../../util/crypt.js';
import { TooManyRequestsError } from '../common/errors/types/TooManyRequestsError.js';
import { RateLimitService } from '../../shared/rate-limit/rate-limit.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let userService: DeepMockProxy<UserService>;
  let rateLimit: DeepMockProxy<RateLimitService>;
  let jwt: DeepMockProxy<JwtService>;
  let storedUser: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: UserService, useValue: mockDeep<UserService>() },
        { provide: RateLimitService, useValue: mockDeep<RateLimitService>() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    rateLimit = module.get(RateLimitService);
    jwt = module.get(JwtService);

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

  it('should sign a 1 hour token, or a 30 days one to keep connected', () => {
    service.createToken(storedUser);
    service.createToken(storedUser, true);

    expect(jwt.sign).toHaveBeenNthCalledWith(
      1,
      { id: 1, name: 'Teste usuário', email: 'emailteste@email.com' },
      { expiresIn: 60 * 60 },
    );
    expect(jwt.sign).toHaveBeenNthCalledWith(2, expect.anything(), {
      expiresIn: 60 * 60 * 24 * 30,
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
