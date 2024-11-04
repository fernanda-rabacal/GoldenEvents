import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly jwtService;
    private readonly userService;
    constructor(jwtService: JwtService, userService: UserService);
    validateUser(email: string, password: string): Promise<{
        user_type: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        user_type_id: number;
        email: string;
        password: string;
        document: string;
        active: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    createToken({ email, password }: AuthLoginDto): Promise<string>;
}
