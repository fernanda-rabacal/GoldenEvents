import { PrismaService } from '../../../db/prisma.service';
export declare class CategoryRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        name: string;
        photo: string;
    }[]>;
    findById(id: number): Promise<{
        id: number;
        name: string;
        photo: string;
    }>;
}
