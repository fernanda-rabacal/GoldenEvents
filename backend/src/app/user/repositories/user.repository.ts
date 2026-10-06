import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { encryptData } from '../../../util/crypt.js';
import { UserTypeEnum } from '../entities/user.entity.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { Prisma } from '@prisma/client';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function removePassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;

  return rest;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: normalizeEmail(createUserDto.email),
        password: await encryptData(createUserDto.password),
        document: createUserDto.document,
        user_type: {
          connect: {
            id: createUserDto.isOrganizer ? UserTypeEnum.ORGANIZER : UserTypeEnum.USER,
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

  async getUserTypes() {
    const userTypes = await this.prisma.userType.findMany();

    return userTypes;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.name) data.name = updateUserDto.name;
    if (updateUserDto.password) data.password = await encryptData(updateUserDto.password);
    if (updateUserDto.userTypeId) {
      data.user_type = {
        connect: {
          id: updateUserDto.userTypeId,
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

  async getUserTickets(userId: number) {
    let tickets = [];
    const categories = await this.prisma.eventCategory.findMany();

    const resultData = await this.prisma.ticket.findMany({
      where: {
        user_id: userId,
      },
      orderBy: { id: 'asc' },
      include: {
        event: {
          select: {
            category_id: true,
          },
        },
      },
    });

    for (const ticket of resultData) {
      const category = categories.find(ct => ct.id === ticket.event.category_id);
      const ticketAlreadyOnCount = tickets.find(
        item => item.event_id === ticket.event_id,
      );

      if (ticketAlreadyOnCount) {
        tickets = tickets.map(item => {
          if (item.event_id === ticketAlreadyOnCount.event_id) item.quantity += 1;

          return item;
        });
      } else {
        tickets.push({ ...ticket, category: category.name, quantity: 1 });
      }
    }

    return tickets;
  }
}
