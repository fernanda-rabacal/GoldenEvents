import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './repositories/user.repository.js';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module.js';

@Module({
  imports: [RateLimitModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
