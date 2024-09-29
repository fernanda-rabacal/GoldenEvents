import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { encryptData } from '../../../util/crypt';
import { UserTypeEnum } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { OffsetPagination } from '../../../response/pagination.response';
import { QueryUserTicketsDto } from '../dto/query-user-ticket.dto';
import { NotFoundError } from '../../common/errors/types/NotFoundError';

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
        user_type_id: UserTypeEnum.USER,
      },
    });

    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        active: true,
      },
      include: {
        user_type: true,
      },
    });

    return users;
  }

  async findById(id: number) {
    const user = await this.prisma.user.findFirst({
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return rest;
  }

  async getUserTypes() {
    const userTypes = await this.prisma.userType.findMany();

    return userTypes;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      data: {
        name: updateUserDto.name,
        user_type_id: updateUserDto.userTypeId,
      },
      where: {
        id,
      },
    });

    return user;
  }

  async deactivate(id: number) {
    return this.prisma.user.update({
      data: {
        active: false,
      },
      where: {
        id,
      },
    });
  }

  async activate(id: number) {
    return this.prisma.user.update({
      data: {
        active: true,
      },
      where: {
        id,
      },
    });
  }

  async getUserTickets(userId: number, query: QueryUserTicketsDto) {
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
      const category = categories.find(
        ct => ct.id === ticket.event.category_id,
      );

      tickets = tickets.reduce(
        (prev, ticket) => {
          const ticketAlreadyOnCount = prev.find(
            item => item.event_id === ticket.event_id,
          );

          if (ticketAlreadyOnCount) {
            prev = prev.map(item => {
              if (item.event_id === ticket.event_id) ticket.quantity += 1;

              return ticket;
            });
          } else {
            prev.push({ ...ticket, category: category.name, quantity: 1 });
          }

          return prev;
        },
        [] as typeof tickets,
      );
    }

    const totalRecords = tickets.length;

    const paginator = new OffsetPagination(
      totalRecords,
      totalRecords,
      query.skip,
      query.take,
    );

    return paginator.buildPage(
      tickets.splice(query.skip * query.take, query.take),
    );
  }
}
