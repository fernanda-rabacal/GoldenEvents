import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
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
@Controller('/user')
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
  async getUserTickets(
    @Param('id') id: string,
    @Query() query: QueryUserTicketsDto,
  ) {
    return await this.userService.getUserTickets(+id, query);
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return await this.userService.findById(+id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return new MessageResponse('Usuário cadastrado com sucesso.', user);
  }

  @Put('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  @Delete('/:id/deactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deactivate(@Param('id') id: string) {
    await this.userService.deactivate(+id);
    return new MessageResponse('Usuário desativado com sucesso.');
  }

  @Patch('/:id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async activate(@Param('id') id: string) {
    await this.userService.activate(+id);
    return new MessageResponse('Usuário ativado com sucesso.');
  }
}
