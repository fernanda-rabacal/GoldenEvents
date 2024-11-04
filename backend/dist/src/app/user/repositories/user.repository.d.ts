import { PrismaService } from '../../../db/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
export declare class UserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
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
    toggleActiveUser(id: number, active: boolean): Promise<{
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
    getUserTickets(userId: number): Promise<any[]>;
}
