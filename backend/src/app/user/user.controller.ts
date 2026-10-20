import { Get, Post, Body, Param, Controller, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import type { Requester } from '../common/auth/requester.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { MessageResponse } from '../common/http/message.response.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/auth/jwt.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import { RateLimit } from '../../shared/rate-limit/rate-limit.guard.js';

@ApiTags('User')
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() requester: Requester) {
    return await this.userService.findAll(requester);
  }

  @Get('/token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() requester: Requester) {
    return await this.userService.findById(requester.id);
  }

  @Get('/types')
  async getUserTypes() {
    return await this.userService.getUserTypes();
  }

  @Get('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string, @CurrentUser() requester: Requester) {
    return await this.userService.findProfile(requester, +id);
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
    @CurrentUser() requester: Requester,
  ) {
    return await this.userService.update(requester, +id, updateUserDto);
  }

  @Patch('/:id/active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async toggleActiveUser(@Param('id') id: string, @CurrentUser() requester: Requester) {
    const activeMessage = {
      true: 'ativado',
      false: 'desativado',
    };
    const user = await this.userService.toggleActiveUser(requester, +id);

    return new MessageResponse(
      `Usuário ${activeMessage[String(user.active)]} com sucesso.`,
      user,
    );
  }
}
