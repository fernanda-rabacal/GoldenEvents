import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RateLimitService } from '../../shared/rate-limit/rate-limit.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockDeep<AuthService>() },
        { provide: RateLimitService, useValue: mockDeep<RateLimitService>() },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
