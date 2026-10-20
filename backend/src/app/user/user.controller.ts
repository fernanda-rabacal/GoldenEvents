import {
  Get,
  Post,
  Body,
  Param,
  Controller,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import type { Requester } from '../common/auth/requester.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { MessageResponse } from '../../response/message.response.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/auth/jwt.guard.js';
import { Request } from 'express';
import { RateLimit } from '../../shared/rate-limit/rate-limit.guard.js';

@ApiTags('User')
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request) {
    return await this.userService.findAll(req.user as Requester);
  }

  @Get('/token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    return await this.userService.findById((req.user as { id: number }).id);
  }

  @Get('/types')
  async getUserTypes() {
    return await this.userService.getUserTypes();
  }

  @Get('/me/tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyTickets(@Req() req: Request) {
    return await this.userService.getUserTickets((req.user as Requester).id);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string, @Req() req: Request) {
    return await this.userService.findProfile(req.user as Requester, +id);
  }

  @Post()
  @RateLimit({
    name: 'signup',
    by: 'ip',
    limit: 10,
    windowMs: 60 * 60_000,
    message: 'Muitos cadastros feitos a partir desta rede.',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return await this.userService.update(req.user as Requester, +id, updateUserDto);
  }

  @Patch('/:id/active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async toggleActiveUser(@Param('id') id: string, @Req() req: Request) {
    const activeMessage = {
      true: 'ativado',
      false: 'desativado',
    };
    const user = await this.userService.toggleActiveUser(req.user as Requester, +id);

    return new MessageResponse(
      `Usuário ${activeMessage[String(user.active)]} com sucesso.`,
      user,
    );
  }
}
