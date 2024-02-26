import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
  MinDate,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @Length(100)
  @ApiProperty()
  description: string;

  @IsNumber()
  @ApiProperty()
  categoryId: number;

  @IsDecimal()
  @Min(0)
  @ApiProperty()
  price: number;

  @IsNumber()
  @Min(1)
  @ApiProperty()
  capacity: number;

  @IsDate()
  @MinDate(new Date())
  @ApiProperty()
  startDateTime: Date;

  @IsDate()
  @MinDate(new Date())
  @ApiProperty()
  endDateTime: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  location: string;

  @ApiHideProperty()
  userId: number;
}
