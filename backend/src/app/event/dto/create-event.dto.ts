import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MinDate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CreateSectorDto } from './sector.dto.js';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  subtitle?: string | null;

  @IsString()
  @Length(100)
  @ApiProperty()
  description: string;

  @IsNumber()
  @ApiProperty()
  categoryId: number;

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

  @IsArray()
  @ArrayMinSize(1, { message: 'O evento precisa ter pelo menos um setor.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSectorDto)
  @ApiProperty({ type: [CreateSectorDto] })
  sectors: CreateSectorDto[];

  @ApiHideProperty()
  userId: number;
}
