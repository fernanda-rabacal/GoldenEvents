import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryUserTicketsDto {
  @IsOptional()
  @ApiProperty()
  skip: number = 0;

  @IsOptional()
  @ApiProperty()
  take: number = 10;
}
