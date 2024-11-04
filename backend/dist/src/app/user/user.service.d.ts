import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserTicketsDto } from './dto/query-user-ticket.dto';
import { UserRepository } from './repositories/user.repository';
export declare class UserService {
    private readonly repository;
    constructor(repository: UserRepository);
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
    findById(id: number): Promise<{
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
    findByEmail(email: string): Promise<{
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
    getUserTypes(): Promise<{
        id: number;
        name: string;
    }[]>;
    update(userId: number, updateUserDto: UpdateUserDto): Promise<{
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
    toggleActiveUser(id: number): Promise<{
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
    getUserTickets(userId: number, query: QueryUserTicketsDto): Promise<import("../../response/pagination.response").Page<any>>;
}
