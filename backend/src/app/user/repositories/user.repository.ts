import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { encryptData } from '../../../util/crypt';
import { UserTypeEnum } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { NotFoundError } from '../../common/errors/types/NotFoundError';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: await encryptData(createUserDto.password),
        document: createUserDto.document,
        user_type: {
          connect: {
            id: UserTypeEnum.USER,
          },
        },
      },
    });

    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        active: true,
      },
    });

    const removePassword = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = user;

      return rest;
    });

    return removePassword;
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

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return rest;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        user_type: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

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

    return user;
  }

  async toggleActiveUser(id: number, active: boolean) {
    return this.prisma.user.update({
      data: {
        active,
      },
      where: {
        id,
      },
    });
  }

  async getUserTickets(userId: number) {
    let tickets = [];
    const categories = await this.prisma.eventCategory.findMany();

    const resultData = await this.prisma.ticket.findMany({
      where: {
        user_id: userId,
      },
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
