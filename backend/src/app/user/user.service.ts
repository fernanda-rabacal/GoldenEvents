import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';
import { UserRepository } from './repositories/user.repository';
import { NotFoundError } from '../common/errors/types/NotFoundError';

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
    return this.repository.findById(id);
  }

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

  async update(userId: number, updateUserDto: UpdateUserDto) {
    return this.repository.update(userId, updateUserDto);
  }

  async toggleActiveUser(id: number) {
    const user = await this.findById(id);

    if (!user) throw new NotFoundError('Usuário não encontrado.');

    return this.repository.toggleActiveUser(id, !user.active);
  }

  async getUserTickets(userId: number, query: QueryUserTicketsDto) {
    return this.repository.getUserTickets(userId, query);
  }
}
