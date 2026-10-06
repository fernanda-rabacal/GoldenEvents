import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { EVENT_SORT_OPTIONS, type EventSort } from '@golden-events/shared';

export class QueryEventDto {
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  active?: string;

  @IsOptional()
  @ApiProperty()
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  take?: number = 10;

  @IsOptional()
  @ApiProperty()
  start_date?: Date;

  @IsOptional()
  @IsIn(EVENT_SORT_OPTIONS)
  @ApiProperty({ required: false, enum: EVENT_SORT_OPTIONS, default: 'start_date' })
  sort?: EventSort = 'start_date';
}
