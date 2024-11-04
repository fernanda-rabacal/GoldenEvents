import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
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
}
export {};
