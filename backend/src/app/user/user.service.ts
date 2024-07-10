import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../db/prisma.service';
import { UserTypeEnum } from './entities/user.entity';
import { encryptData } from '../../util/crypt';
import { OffsetPagination } from 'src/response/pagination.response';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    let userInvalidValid = await this.prismaService.user.findFirst({
      where: {
        document: createUserDto.document,
      },
    });

    if (userInvalidValid) {
      throw new BadRequestException({
        message: 'O esse documento já está cadastrado.',
      });
    }

    userInvalidValid = await this.prismaService.user.findFirst({
      where: {
        email: createUserDto.email,
      },
    });

    if (userInvalidValid) {
      throw new BadRequestException({
        message: 'O esse email já está cadastrado.',
      });
    }

    const user = this.prismaService.user.create({
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
    const users = await this.prismaService.user.findMany({
      where: {
        active: true,
      },
      include: {
        user_type: true,
      },
    });

    if (users.length == 0) {
      throw new HttpException([], HttpStatus.NO_CONTENT);
    }

    return users;
  }

  async findById(id: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
      },
      include: {
        user_type: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ message: 'Usuário não encontrado.' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return rest;
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          email: email,
        },
      });

      return user;
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }

  async getUserTypes() {
    const userTypes = await this.prismaService.userType.findMany();

    if (userTypes.length == 0) {
      throw new HttpException([], HttpStatus.NO_CONTENT);
    }

    return userTypes;
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prismaService.user.update({
        data: {
          name: updateUserDto.name,
          user_type_id: updateUserDto.userTypeId,
        },
        where: {
          id: userId,
        },
      });

      return user;
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }

  async deactivate(userId: number) {
    try {
      await this.prismaService.user.update({
        data: {
          active: false,
        },
        where: {
          id: userId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }

  async activate(userId: number) {
    try {
      await this.prismaService.user.update({
        data: {
          active: true,
        },
        where: {
          id: userId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }

  async getUserTickets(userId: number, query: QueryUserTicketsDto) {
    try {
      let tickets = [];

      const resultData = await this.prismaService.ticket.findMany({
        where: {
          user_id: userId,
        },
        include: {
          event: true,
        },
      });

      for (const item of resultData) {
        const category = await this.prismaService.eventCategory.findUnique({
          where: {
            id: item.event.category_id,
          },
        });

        const sameEventTicket = tickets.find(
          (ticket) => ticket.event_id === item.event_id,
        );

        if (sameEventTicket) {
          tickets = tickets.map((ticket) => {
            if (sameEventTicket.event_id === ticket.event_id)
              ticket.quantity += 1;

            return ticket;
          });
        } else {
          tickets.push({
            ...item,
            category: category.name,
            quantity: 1,
          });
        }
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
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }
}
