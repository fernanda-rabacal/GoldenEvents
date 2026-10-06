import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto.js';
import { UserRepository } from './repositories/user.repository.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { OffsetPagination } from '../../response/pagination.response.js';
import { UserTypeEnum } from './entities/user.entity.js';

// Usuário autenticado (req.user)
export type Requester = { id: number; user_type_id: number };

function isAdmin(requester: Requester) {
  return requester.user_type_id === UserTypeEnum.ADMIN;
}

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    return this.repository.create(createUserDto);
  }

  async findAll() {
    const users = await this.repository.findAll();

    if (users.length == 0) {
      throw new HttpException([], HttpStatus.NO_CONTENT);
    }

    return users;
  }

  async findById(id: number) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return user;
  }

  // Retorna null quando não encontra: o login trata e responde com credenciais inválidas
  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async getUserTypes() {
    const userTypes = await this.repository.getUserTypes();

    if (userTypes.length == 0) {
      throw new HttpException([], HttpStatus.NO_CONTENT);
    }

    return userTypes;
  }

  assertCanAccessUser(requester: Requester, userId: number) {
    if (requester.id !== userId && !isAdmin(requester)) {
      throw new ForbiddenException('Você só pode acessar o seu próprio perfil.');
    }
  }

  async findProfile(requester: Requester, userId: number) {
    this.assertCanAccessUser(requester, userId);

    return this.findById(userId);
  }

  async update(requester: Requester, userId: number, updateUserDto: UpdateUserDto) {
    this.assertCanAccessUser(requester, userId);

    if (updateUserDto.userTypeId === UserTypeEnum.ADMIN && !isAdmin(requester)) {
      throw new ForbiddenException(
        'Somente administradores podem conceder o perfil de administrador.',
      );
    }

    return this.repository.update(userId, updateUserDto);
  }

  async toggleActiveUser(id: number) {
    const user = await this.findById(id);

    if (!user) throw new NotFoundError('Usuário não encontrado.');

    return this.repository.toggleActiveUser(id, !user.active);
  }

  async getUserTickets(userId: number, query: QueryUserTicketsDto) {
    const tickets = await this.repository.getUserTickets(userId);

    const totalRecords = tickets.length;

    const paginator = new OffsetPagination(
      totalRecords,
      totalRecords,
      query.skip,
      query.take,
    );

    return paginator.paginate(tickets);
  }
}
