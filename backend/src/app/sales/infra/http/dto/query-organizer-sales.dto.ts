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
import { SALES_PERIOD_OPTIONS, type SalesPeriod } from '@golden-events/shared';

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
