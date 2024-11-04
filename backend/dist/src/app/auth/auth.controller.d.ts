import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthService } from './auth.service';
import { TokenResponse } from '../../response/token.response';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(authLoginDto: AuthLoginDto): Promise<TokenResponse>;
}
