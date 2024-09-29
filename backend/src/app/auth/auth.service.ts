import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenDto } from './dto/auth-token.dto';
import { compareEncrypedData } from '../../util/crypt';
import { NotFoundError } from '../common/errors/types/NotFoundError';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    const validPassword = compareEncrypedData(user.password, password);

    if (!validPassword) {
      return null;
    }

    return user;
  }

  async createToken({ email, password }: AuthLoginDto) {
    const user = await this.validateUser(email, password);

    const authTokenDto: AuthTokenDto = {
      id: user.id,
      name: user.name,
      email,
    };

    return this.jwtService.sign(authTokenDto);
  }
}
