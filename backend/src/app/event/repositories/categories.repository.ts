import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.eventCategory.findMany();
    return categories;
  }

  async findById(id: number) {
    const category = await this.prisma.eventCategory.findFirst({
      where: {
        id,
      },
    });

    return category;
  }
}
