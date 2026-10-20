import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../token-payload.js';
import { AuthService } from '../auth.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('SECRET'),
    });
  }

  async validate(payload: TokenPayload & { iat: number }) {
    const user = payload && (await this.authService.validateSession(payload));

    if (!user) {
      throw new UnauthorizedException('Sua sessão expirou. Entre novamente.');
    }

    return user;
  }
}
