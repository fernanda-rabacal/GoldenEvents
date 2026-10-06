import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto.js';
import { AuthService } from './auth.service.js';
import { TokenResponse } from '../../response/token.response.js';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guard/local.guard.js';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Body() authLoginDto: AuthLoginDto) {
    const token = await this.authService.createToken(authLoginDto);
    return new TokenResponse(token, 'bearer');
  }
}
