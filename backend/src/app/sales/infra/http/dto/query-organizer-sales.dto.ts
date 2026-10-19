import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AUDIENCE_SEGMENT_OPTIONS,
  AUDIENCE_SORT_OPTIONS,
  SALES_PERIOD_OPTIONS,
  type AudienceSegment,
  type AudienceSort,
  type SalesPeriod,
} from '@golden-events/shared';

export class QueryOrganizerSummaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  event_id?: number;

  // Sem período: desde o início das vendas
  @ApiPropertyOptional({ enum: SALES_PERIOD_OPTIONS })
  @IsOptional()
  @Type(() => Number)
  @IsIn(SALES_PERIOD_OPTIONS)
  days?: SalesPeriod;
}

export class QueryOrganizerOrdersDto extends QueryOrganizerSummaryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  // Nome ou e-mail do comprador
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buyer_id?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}

export class QueryOrganizerAudienceSummaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  event_id?: number;
}

export class QueryOrganizerAudienceDto extends QueryOrganizerAudienceSummaryDto {
  // Nome ou e-mail do comprador
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: AUDIENCE_SEGMENT_OPTIONS })
  @IsOptional()
  @IsIn(AUDIENCE_SEGMENT_OPTIONS)
  segment?: AudienceSegment;

  @ApiPropertyOptional({ enum: AUDIENCE_SORT_OPTIONS, default: 'recent' })
  @IsOptional()
  @IsIn(AUDIENCE_SORT_OPTIONS)
  sort?: AudienceSort = 'recent';

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}
