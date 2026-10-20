import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TicketsService } from '../../application/tickets.service.js';
import { JwtAuthGuard } from '../../../common/auth/jwt.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { Requester } from '../../../common/auth/requester.js';

// Os ingressos são de vendas, mas a rota continua em /users/me para não mudar a API
@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/users')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('/me/tickets')
  async findMine(@CurrentUser() requester: Requester) {
    return this.ticketsService.findMine(requester.id);
  }
}
