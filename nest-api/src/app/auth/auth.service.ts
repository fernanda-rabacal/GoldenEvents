import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenDto } from './dto/auth-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async createToken({ email, password }: AuthLoginDto) {
    const user = await this.userService.findByEmail(email);

    if (!user || user.password != password) {
      return null;
    }

    const authTokenDto: AuthTokenDto = {
      id: user.id,
      email,
    };
    return this.jwtService.sign(authTokenDto);
  }
}
