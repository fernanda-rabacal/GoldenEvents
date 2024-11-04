import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MessageResponse } from '../../response/message.response';
import { Request } from 'express';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<{
        id: number;
        name: string;
        user_type_id: number;
        email: string;
        document: string;
        active: boolean;
        created_at: Date;
        updated_at: Date;
    }[]>;
    getMe(req: Request): Promise<{
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
    getUserTypes(): Promise<{
        id: number;
        name: string;
    }[]>;
    getUserTickets(id: string, query: QueryUserTicketsDto): Promise<import("../../response/pagination.response").Page<any>>;
    findById(id: string): Promise<{
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
    create(createUserDto: CreateUserDto): Promise<{
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
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
    toggleActiveUser(id: string): Promise<MessageResponse>;
}
