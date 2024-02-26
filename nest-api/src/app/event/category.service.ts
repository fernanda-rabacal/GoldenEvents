import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const categories = await this.prismaService.eventCategory.findMany();
    return categories;
  }

  async findById(categoryId: number) {
    const category = this.prismaService.eventCategory.findFirst({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return category;
  }
}
