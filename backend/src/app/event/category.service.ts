import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './repositories/categories.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findById(categoryId: number) {
    return this.repository.findById(categoryId);
  }
}
