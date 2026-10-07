import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class BuyEventTicketDto {
  // Vem da URL (/events/:id/buy-ticket), não do corpo
  @ApiHideProperty()
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
