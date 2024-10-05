import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

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
  @ApiProperty()
  skip?: number = 0;

  @IsOptional()
  @ApiProperty()
  take?: number = 10;

  @IsOptional()
  @ApiProperty()
  start_date?: Date;
}
