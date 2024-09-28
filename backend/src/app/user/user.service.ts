import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';
import { UserRepository } from './repositories/user.reposytory';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    return this.repository.create(createUserDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    return this.repository.findById(id);
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async getUserTypes() {
    return this.repository.getUserTypes();
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    return this.repository.update(userId, updateUserDto);
  }

  async deactivate(userId: number) {
    return this.repository.deactivate(userId);
  }

  async activate(userId: number) {
    return this.repository.activate(userId);
  }

  async getUserTickets(userId: number, query: QueryUserTicketsDto) {
    return this.repository.getUserTickets(userId, query);
  }
}
