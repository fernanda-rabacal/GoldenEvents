import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    const token = await this.authService.createToken({
      email,
      password,
    });

    if (!token) {
      throw new UnauthorizedException({
        message: 'Credenciais Inválidas.',
      });
    }

    return token;
  }
}
