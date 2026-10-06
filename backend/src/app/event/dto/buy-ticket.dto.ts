import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class BuyEventTicketDto {
  @ApiProperty()
  @IsNumber()
  eventId: number;

  @ApiProperty()
  @IsNumber()
  paymentMethodId: number;

  @ApiHideProperty()
  userId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number = 1;
}
