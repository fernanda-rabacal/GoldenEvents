import { ApiProperty } from '@nestjs/swagger';
import { BuyEventTicketDto } from './buy-ticket.dto';
import { IsNumber } from 'class-validator';

export class CreateTicketDto extends BuyEventTicketDto {
  @ApiProperty()
  @IsNumber()
  price: number;
}
