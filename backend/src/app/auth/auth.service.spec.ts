import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { encryptData } from '../../util/crypt.js';

describe('AuthService', () => {
  let service: AuthService;
  let userService: DeepMockProxy<UserService>;
  let storedUser: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: UserService, useValue: mockDeep<UserService>() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);

    storedUser = {
      id: 1,
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456'),
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
});
