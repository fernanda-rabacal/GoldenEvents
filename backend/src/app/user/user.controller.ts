import {
  Get,
  Post,
  Body,
  Param,
  Controller,
  Patch,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MessageResponse } from '../../response/message.response';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { Request } from 'express';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';

@ApiTags('User')
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get('/token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    return await this.userService.findById(req.user.id);
  }

  @Get('/types')
  async getUserTypes() {
    return await this.userService.getUserTypes();
  }

  @Get('/tickets/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getUserTickets(@Param('id') id: string, @Query() query: QueryUserTicketsDto) {
    return await this.userService.getUserTickets(+id, query);
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return await this.userService.findById(+id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  @Patch('/:id/active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async toggleActiveUser(@Param('id') id: string) {
    const activeMessage = {
      true: 'ativado',
      false: 'desativado',
    };
    const user = await this.userService.toggleActiveUser(+id);

    return new MessageResponse(
      `Usuário ${activeMessage[String(user.active)]} com sucesso.`,
      user,
    );
  }
}
