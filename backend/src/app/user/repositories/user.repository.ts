import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';
import { encryptData } from '../../../util/crypt.js';
import { UserTypeEnum } from '../entities/user.entity.js';
import type { CreateUserInput, UserChanges } from '../user-inputs.js';
import { Prisma } from '@prisma/client';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function removePassword<T extends { password: string; password_changed_at: Date | null }>(
  user: T,
): Omit<T, 'password' | 'password_changed_at'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, password_changed_at, ...rest } = user;

  return rest;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput) {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: normalizeEmail(input.email),
        password: await encryptData(input.password),
        document: input.document,
        user_type: {
          connect: {
            id: input.isOrganizer ? UserTypeEnum.ORGANIZER : UserTypeEnum.USER,
          },
        },
      },
    });

    return removePassword(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        active: true,
      },
      orderBy: { id: 'asc' },
    });

    return users.map(removePassword);
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        user_type: true,
      },
    });

    if (!user) return null;

    return removePassword(user);
  }

  // Único método que devolve a senha: usado só pela autenticação para comparar o hash
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizeEmail(email),
      },
      include: {
        user_type: true,
      },
    });

    return user;
  }

  async findPasswordHash(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    return user?.password ?? null;
  }

  // O que o JwtStrategy precisa para aceitar o token a cada requisição
  async findSession(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        user_type_id: true,
        active: true,
        password_changed_at: true,
      },
    });
  }

  async findContacts(ids: number[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });
  }

  async findIdsMatching(term: string, take: number) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take,
    });

    return users.map(({ id }) => id);
  }

  async getUserTypes() {
    const userTypes = await this.prisma.userType.findMany();

    return userTypes;
  }

  async update(id: number, changes: UserChanges) {
    const data: Prisma.UserUpdateInput = {};

    if (changes.name) data.name = changes.name;
    if (changes.password) {
      data.password = await encryptData(changes.password);
      data.password_changed_at = new Date();
      data.refresh_tokens = { deleteMany: {} };
    }
    if (changes.userTypeId) {
      data.user_type = {
        connect: {
          id: changes.userTypeId,
        },
      };
    }

    const user = await this.prisma.user.update({
      data,
      where: {
        id,
      },
    });

    return removePassword(user);
  }

  async toggleActiveUser(id: number, active: boolean) {
    const user = await this.prisma.user.update({
      data: {
        active,
      },
      where: {
        id,
      },
    });

    return removePassword(user);
  }
}
