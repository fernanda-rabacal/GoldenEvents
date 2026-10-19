import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto.js';
import { AuthService } from './auth.service.js';
import { AuthTokenDto } from './dto/auth-token.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { TokenResponse } from '../../response/token.response.js';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guard/local.guard.js';
import { RateLimit } from '../../shared/rate-limit/rate-limit.guard.js';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // O limite por IP roda antes do LocalAuthGuard: a tentativa recusada não chega ao bcrypt
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @RateLimit({
    name: 'login-ip',
    by: 'ip',
    limit: 20,
    windowMs: 60_000,
    message: 'Muitas tentativas de login a partir desta rede.',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() { keepConnected }: AuthLoginDto) {
    const session = await this.authService.startSession(
      req.user as AuthTokenDto,
      keepConnected,
    );

    return new TokenResponse(session, 'bearer');
  }

  @Post('/refresh')
  @RateLimit({
    name: 'refresh-ip',
    by: 'ip',
    limit: 60,
    windowMs: 60_000,
    message: 'Muitas renovações de sessão a partir desta rede.',
  })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() { refreshToken }: RefreshTokenDto) {
    return new TokenResponse(await this.authService.refresh(refreshToken), 'bearer');
  }

  // Sem JwtAuthGuard: o access token pode já ter expirado quando a pessoa sai
  @Post('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() { refreshToken }: RefreshTokenDto) {
    await this.authService.logout(refreshToken);
  }
}
