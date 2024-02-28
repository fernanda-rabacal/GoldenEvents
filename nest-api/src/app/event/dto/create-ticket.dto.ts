import { ApiProperty } from '@nestjs/swagger';
import { BuyEventTicket } from './buy-ticket.dto';
import { IsNumber } from 'class-validator';

export class CreateTicketDto extends BuyEventTicket {
  @ApiProperty()
  @IsNumber()
  price: number;
}
