import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenDto } from '../dto/auth-token.dto.js';
import { UserService } from '../../../app/user/user.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('SECRET'),
    });
  }

  async validate(payload: AuthTokenDto) {
    if (!payload) {
      throw new UnauthorizedException('Não autenticado.');
    }

    const user = await this.userService.findById(payload.id);
    return user;
  }
}
