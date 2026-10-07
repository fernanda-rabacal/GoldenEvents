import { UniqueConstraintError } from './../common/errors/types/UniqueConstraintError.js';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { encryptData } from '../../util/crypt.js';
import { UserTypeEnum } from './entities/user.entity.js';
import { UserRepository } from './repositories/user.repository.js';
import { PrismaService } from '../../db/prisma.service.js';
import { PrismaClientMock } from '../../db/prisma.mock.js';
import { PrismaClientError } from '../common/errors/types/PrismaClientError.js';
import { PrismaErrors } from '../common/errors/utils/handle-database-errors.util.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaClientMock;
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

    const event = {
      id: 1,
      name: 'Festival de Verão',
      slug: 'festival-de-verao',
      photo: 'foto.png',
      start_date: new Date(),
      end_date: null,
      location: 'Parque da Cidade',
      category: { name: 'Shows' },
    };

    expectedOutputUserTickets = [
      { id: 1, created_at: new Date(), event },
      { id: 2, created_at: new Date(), event },
      { id: 3, created_at: new Date(), event: { ...event, id: 2 } },
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

  it('should return an empty list when there are no user types', async () => {
    prisma.userType.findMany.mockResolvedValueOnce([]);

    await expect(service.getUserTypes()).resolves.toEqual([]);
  });

  it('should create a user', async () => {
    const createdUser = {
      ...expectedOutputUser,
      password: await encryptData('123456789'),
    };

    const mockUser: CreateUserDto = {
      name: 'Teste usuário',
      email: '  EmailTeste@Email.com ',
      password: '123456789',
      document: '12345678910',
    };

    prisma.user.create.mockResolvedValueOnce(createdUser);

    const newUser = await service.create(mockUser);

    expect(newUser).toStrictEqual(expectedOutputUser);
    expect(newUser).not.toHaveProperty('password');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'emailteste@email.com' }),
      }),
    );
  });

  it.each([
    { isOrganizer: undefined, expectedType: UserTypeEnum.USER },
    { isOrganizer: false, expectedType: UserTypeEnum.USER },
    { isOrganizer: true, expectedType: UserTypeEnum.ORGANIZER },
  ])(
    'should create a user with type $expectedType when isOrganizer is $isOrganizer',
    async ({ isOrganizer, expectedType }) => {
      prisma.user.create.mockResolvedValueOnce(expectedOutputUser);

      await service.create({
        name: 'Teste usuário',
        email: 'emailteste@email.com',
        password: '123456789',
        document: '12345678910',
        isOrganizer,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_type: { connect: { id: expectedType } },
          }),
        }),
      );
    },
  );

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

  it('should find an user by his e-mail with the password hash for authentication', async () => {
    const userWithPassword = {
      ...expectedOutputUser,
      password: await encryptData('123456789'),
    };

    prisma.user.findUnique.mockResolvedValueOnce(userWithPassword);

    const user = await service.findByEmail(' EmailTeste@Email.com');

    expect(user).toStrictEqual(userWithPassword);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'emailteste@email.com' } }),
    );
  });

  it('should update an user', async () => {
    const updateUserData = {
      password: '987654321',
      name: 'Teste 2',
      userTypeId: UserTypeEnum.ORGANIZER,
    };
    const updatedUser = {
      ...expectedOutputUser,
      ...updateUserData,
    };

    prisma.user.update.mockResolvedValueOnce(updatedUser);

    const user = await service.update(
      { id: 1, user_type_id: UserTypeEnum.USER },
      1,
      updateUserData,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...updatedUserWithoutPassword } = updatedUser;

    expect(user).toStrictEqual(updatedUserWithoutPassword);
  });

  it('should not let an user update another user', async () => {
    await expect(
      service.update({ id: 2, user_type_id: UserTypeEnum.USER }, 1, { name: 'Outro' }),
    ).rejects.toThrow(new ForbiddenError('Você só pode acessar o seu próprio perfil.'));
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should not let an user promote himself to admin', async () => {
    await expect(
      service.update({ id: 1, user_type_id: UserTypeEnum.USER }, 1, {
        userTypeId: UserTypeEnum.ADMIN,
      }),
    ).rejects.toThrow(
      new ForbiddenError(
        'Somente administradores podem conceder o perfil de administrador.',
      ),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should let an admin update another user to admin', async () => {
    prisma.user.update.mockResolvedValueOnce(expectedOutputUser);

    await service.update({ id: 2, user_type_id: UserTypeEnum.ADMIN }, 1, {
      userTypeId: UserTypeEnum.ADMIN,
    });

    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should find the own profile', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(expectedOutputUser);

    const user = await service.findProfile({ id: 1, user_type_id: UserTypeEnum.USER }, 1);

    expect(user).toStrictEqual(expectedOutputUser);
  });

  it('should not find the profile of another user', async () => {
    await expect(
      service.findProfile({ id: 2, user_type_id: UserTypeEnum.ORGANIZER }, 1),
    ).rejects.toThrow(new ForbiddenError('Você só pode acessar o seu próprio perfil.'));
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should deactivate an user', async () => {
    const deactivatedUser = { ...expectedOutputUser, active: false };

    prisma.user.findUnique.mockResolvedValueOnce(expectedOutputUser);
    prisma.user.update.mockResolvedValueOnce({
      ...deactivatedUser,
      password: await encryptData('123456789'),
    });

    const user = await service.toggleActiveUser(1);

    expect(user).toStrictEqual(deactivatedUser);
  });

  it('should throw an NotFound error on deactivate an user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(undefined);

    await expect(service.toggleActiveUser(1)).rejects.toThrow(
      new NotFoundError('Usuário não encontrado.'),
    );
  });

  it('should group the user tickets by event', async () => {
    prisma.ticket.findMany.mockResolvedValueOnce(expectedOutputUserTickets);

    const [first, second] = expectedOutputUserTickets;
    const tickets = await service.getUserTickets(1);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1 } }),
    );
    expect(tickets).toHaveLength(2);
    expect(tickets[0]).toStrictEqual({
      event: first.event,
      quantity: 2,
      tickets: [
        { id: first.id, created_at: first.created_at },
        { id: second.id, created_at: second.created_at },
      ],
    });
    expect(tickets[1].quantity).toBe(1);
  });
});
