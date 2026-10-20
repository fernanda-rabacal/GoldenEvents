import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryMetricsDto } from './dto/query-metrics.dto.js';
import { OrganizerMetricsService } from '../../application/organizer-metrics.service.js';
import { JwtAuthGuard } from '../../../common/auth/jwt.guard.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { Requester } from '../../../common/auth/requester.js';

// Leituras de vendas que continuam em /events para não mudar a API
@ApiTags('Event')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/events')
export class OrganizerMetricsController {
  constructor(private readonly metricsService: OrganizerMetricsService) {}

  @Get('/me/metrics')
  async getMyMetrics(
    @Query() query: QueryMetricsDto,
    @CurrentUser() requester: Requester,
  ) {
    return this.metricsService.metrics(requester, query.days);
  }

  @Get('/:id/lots/sales')
  async getLotSales(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: Requester,
  ) {
    return this.metricsService.lotSales(requester, id);
  }
}
