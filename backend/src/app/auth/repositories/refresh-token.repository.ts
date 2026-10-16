import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    user_id: number;
    family_id: string;
    token_hash: string;
    keep_connected: boolean;
    expires_at: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findByHash(token_hash: string) {
    return this.prisma.refreshToken.findUnique({ where: { token_hash } });
  }

  async markRotated(id: string, now: Date) {
    await this.prisma.refreshToken.updateMany({
      where: { id, rotated_at: null },
      data: { rotated_at: now },
    });
  }

  async deleteFamily(family_id: string) {
    await this.prisma.refreshToken.deleteMany({ where: { family_id } });
  }

  async deleteExpired(user_id: number, now: Date) {
    await this.prisma.refreshToken.deleteMany({
      where: { user_id, expires_at: { lt: now } },
    });
  }
}
