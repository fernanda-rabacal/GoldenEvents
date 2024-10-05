import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MinDate,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

  @IsNumber()
  @Min(0)
  @ApiProperty()
  price: number;

  @IsNumber()
  @Min(1)
  @ApiProperty()
  capacity: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @MinDate(() => new Date())
  @ApiProperty()
  startDateTime: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @MinDate(new Date())
  @ApiProperty({ required: false })
  endDateTime?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  location: string;

  @ApiHideProperty()
  userId: number;
}
