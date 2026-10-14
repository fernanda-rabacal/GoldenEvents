import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_TICKETS_PER_ORDER } from '@golden-events/shared';

export class OrderItemDto {
  @ApiProperty()
  @IsInt()
  lotId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(MAX_TICKETS_PER_ORDER)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_TICKETS_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
