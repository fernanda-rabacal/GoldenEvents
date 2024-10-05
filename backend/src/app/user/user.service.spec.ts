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
import { NotFoundError } from '../common/errors/types/NotFoundError';
import { HttpException, HttpStatus } from '@nestjs/common';

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
        event: {
          category_id: 1,
        },
      },
    ];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all user types', async () => {
    prisma.userType.findMany.mockResolvedValueOnce(expectedOutputUserTypes);

    const userTypes = await service.getUserTypes();

    expect(userTypes).toStrictEqual(expectedOutputUserTypes);
  });

  it('should throw a HTTPException error on no content types', async () => {
    prisma.userType.findMany.mockResolvedValueOnce([]);

    await expect(service.getUserTypes()).rejects.toThrow(
      new HttpException([], HttpStatus.NO_CONTENT),
    );
  });

  it('should create a user', async () => {
    const createdUser = {
      ...expectedOutputUser,
      password: await encryptData('123456789'),
    };

    const mockUser: CreateUserDto = {
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456789'),
      document: '12345678910',
    };

    prisma.user.create.mockResolvedValueOnce(createdUser);

    const newUser = await service.create(mockUser);

    expect(newUser).toStrictEqual(createdUser);
  });

  it('should throw a conflict error on create with existent email', async () => {
    const mockUser: CreateUserDto = {
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      password: await encryptData('123456789'),
      document: '12345678910',
    };

    prisma.user.create.mockImplementation(newUser => {
      const prismaError: PrismaClientError = {
        meta: { target: 'email' },
        code: PrismaErrors.UniqueConstraintFail,
        message: 'test',
        clientVersion: 'test',
        name: 'error',
        [Symbol.toStringTag]: 'sei la',
      };

      if (newUser.data.email === expectedOutputUser.email) {
        throw new UniqueConstraintError(prismaError);
      }

      return expectedOutputUser;
    });

    await expect(service.create(mockUser)).rejects.toThrow();
  });

  it('should get all users', async () => {
    prisma.user.findMany.mockResolvedValueOnce([expectedOutputUser]);

    const users = await service.findAll();

    expect(expectedOutputUser).toStrictEqual(users[0]);
  });

  it('should find an user by his id', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(expectedOutputUser);

    const user = await service.findById(1);

    expect(expectedOutputUser).toStrictEqual(user);
  });

  it('should find an user by his e-mail', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(expectedOutputUser);

    const user = await service.findByEmail('emailteste@email.com');

    expect(expectedOutputUser).toStrictEqual(user);
  });

  it('should update an user', async () => {
    const updateUserData = {
      password: '987654321',
      name: 'Teste 2',
      userTypeId: UserTypeEnum.ADMIN,
    };
    const updatedUser = {
      ...expectedOutputUser,
      ...updateUserData,
    };

    prisma.user.update.mockResolvedValueOnce(updatedUser);

    const user = await service.update(1, updateUserData);

    expect(user).toStrictEqual(updatedUser);
  });

  it('should deactivate an user', async () => {
    const deactivatedUser = { ...expectedOutputUser, active: false };

    prisma.user.findUnique.mockResolvedValueOnce(expectedOutputUser);
    prisma.user.update.mockResolvedValueOnce(deactivatedUser);

    const user = await service.toggleActiveUser(1);

    expect(user).toStrictEqual(deactivatedUser);
  });

  it('should throw an NotFound error on deactivate an user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(undefined);

    await expect(service.toggleActiveUser(1)).rejects.toThrow(
      new NotFoundError('Usuário não encontrado.'),
    );
  });

  it('should get all user tickets', async () => {
    prisma.eventCategory.findMany.mockResolvedValueOnce([
      { id: 1, name: 'teste', photo: 'klsmskl' },
    ]);
    prisma.ticket.findMany.mockResolvedValueOnce(expectedOutputUserTickets);

    const expectedTickets = expectedOutputUserTickets.map(ticket => ({
      ...ticket,
      quantity: 1,
      category: 'teste',
    }));

    const tickets = await service.getUserTickets(1, { skip: 0, take: 10 });

    expect(tickets).toHaveProperty('content');
    expect(tickets.totalRecords).toBe(1);
    expect(tickets.content).toStrictEqual(expectedTickets);
  });
});
