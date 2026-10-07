import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRepository } from './repositories/user.repository.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
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
    return this.repository.findAll();
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
    return this.repository.getUserTypes();
  }

  assertCanAccessUser(requester: Requester, userId: number) {
    if (requester.id !== userId && !isAdmin(requester)) {
      throw new ForbiddenError('Você só pode acessar o seu próprio perfil.');
    }
  }

  async findProfile(requester: Requester, userId: number) {
    this.assertCanAccessUser(requester, userId);

    return this.findById(userId);
  }

  async update(requester: Requester, userId: number, updateUserDto: UpdateUserDto) {
    this.assertCanAccessUser(requester, userId);

    if (updateUserDto.userTypeId === UserTypeEnum.ADMIN && !isAdmin(requester)) {
      throw new ForbiddenError(
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

  async getUserTickets(userId: number) {
    const tickets = await this.repository.getUserTickets(userId);
    const byEvent = new Map<
      number,
      {
        event: (typeof tickets)[number]['event'];
        quantity: number;
        tickets: { id: number; created_at: Date }[];
      }
    >();

    for (const { event, ...ticket } of tickets) {
      const group = byEvent.get(event.id) ?? { event, quantity: 0, tickets: [] };

      group.quantity += 1;
      group.tickets.push(ticket);
      byEvent.set(event.id, group);
    }

    return [...byEvent.values()];
  }
}
