import { Module, OnModuleInit } from '@nestjs/common';
import { assertInternalKey } from './client-ip.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule implements OnModuleInit {
  onModuleInit() {
    assertInternalKey();
  }
}
