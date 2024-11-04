import { CategoryRepository } from './repositories/categories.repository';
export declare class CategoryService {
    private readonly repository;
    constructor(repository: CategoryRepository);
    findAll(): Promise<{
        id: number;
        name: string;
        photo: string;
    }[]>;
    findById(categoryId: number): Promise<{
        id: number;
        name: string;
        photo: string;
    }>;
}
