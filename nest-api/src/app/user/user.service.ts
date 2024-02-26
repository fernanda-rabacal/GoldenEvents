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
import { PrismaService } from 'src/db/prisma.service';
import { UserTypeEnum } from './entities/user.entity';
import { encryptData } from 'src/util/crypt';

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
    });

    if (!user) {
      throw new NotFoundException({ message: 'Usuário não encontrado.' });
    }

    return user;
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

  async update(userId: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prismaService.user.update({
        data: {
          ...updateUserDto,
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
}
