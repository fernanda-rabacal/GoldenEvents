import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { METRICS_PERIOD_OPTIONS, type MetricsPeriod } from '@golden-events/shared';

export class QueryMetricsDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn(METRICS_PERIOD_OPTIONS)
  @ApiProperty({ required: false, enum: METRICS_PERIOD_OPTIONS, default: 7 })
  days?: MetricsPeriod = 7;
}
