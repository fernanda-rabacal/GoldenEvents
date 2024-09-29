import { UniqueConstraintError } from './../common/errors/types/UniqueConstraintError';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { encryptData } from '../../util/crypt';
import { UserTypeEnum } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { PrismaService } from '../../db/prisma.service';
import { PrismaClientError } from '../common/errors/types/PrismaClientError';
import { PrismaErrors } from '../common/errors/utils/handle-database-errors.util';

describe('UserService', () => {
  let service: UserService;
  let prisma: DeepMockProxy<PrismaClient>;
  let expectedOutputUser: any;
  let expectedOutputUserTypes: any;
  let expectedOutputUserTickets: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, UserRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get(UserService);
    prisma = module.get(PrismaService);

    expectedOutputUser = {
      id: 1,
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456789'),
      document: '12345678910',
      user_type_id: UserTypeEnum.USER,
      created_at: new Date(),
      update_at: new Date(),
    };

    expectedOutputUserTypes = [
      {
        id: 1,
        name: 'Admin',
      },
      {
        id: 2,
        name: 'User',
      },
    ];

    expectedOutputUserTickets = [
      {
        id: 1,
        event_id: 1,
        user_id: 1,
        price: 10,
        payment_method_id: 1,
        created_at: new Date(),
        update_at: new Date(),
        quantity: 1,
        category: 'teste',
        event: {
          category_id: 1,
        },
      },
    ];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const mockUser: CreateUserDto = {
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456789'),
      document: '12345678910',
    };

    prisma.user.create.mockResolvedValueOnce(expectedOutputUser);

    const newUser = await service.create(mockUser);

    expect(newUser).toStrictEqual(expectedOutputUser);
  });

  it('should throw a conflict error on create with existent email', async () => {
    const mockUser: CreateUserDto = {
      name: 'Teste usuário',
      email: 'davi@email.com',
      password: await encryptData('123456789'),
      document: '12345678910',
    };

    prisma.user.create.mockImplementation(() => {
      const prismaError: PrismaClientError = {
        meta: { target: 'email' },
        code: PrismaErrors.UniqueConstraintFail,
        message: 'test',
        clientVersion: 'test',
        name: 'error',
        [Symbol.toStringTag]: 'sei la',
      };

      throw new UniqueConstraintError(prismaError);
    });

    await expect(service.create(mockUser)).rejects.toThrow();
  });

  it('should get all users', async () => {
    prisma.user.findMany.mockResolvedValueOnce([expectedOutputUser]);

    const users = await service.findAll();

    expect(expectedOutputUser).toStrictEqual(users[0]);
  });
});
