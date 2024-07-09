import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class BuyEventTicket {
  @ApiProperty()
  @IsNumber()
  eventId: number;

  @ApiProperty()
  @IsNumber()
  paymentMethodId: number;

  @ApiHideProperty()
  userId: number;

  @ApiProperty()
  @IsNumber()
  quantity: number = 1;
}
