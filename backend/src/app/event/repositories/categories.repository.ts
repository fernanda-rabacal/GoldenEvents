import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/app/common/errors/types/NotFoundError';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.eventCategory.findMany();
    return categories;
  }

  async findById(id: number) {
    const category = this.prisma.eventCategory.findFirst({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    return category;
  }
}
