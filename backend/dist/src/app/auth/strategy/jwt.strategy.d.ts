import { Strategy } from 'passport-jwt';
import { AuthTokenDto } from '../dto/auth-token.dto';
import { UserService } from '../../../app/user/user.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userService;
    constructor(userService: UserService);
    validate(payload: AuthTokenDto): Promise<{
        user_type: {
            id: number;
            name: string;
        };
        id: number;
        name: string;
        user_type_id: number;
        email: string;
        document: string;
        active: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
}
export {};
