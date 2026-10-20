import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateLotDto, UpdateLotDto } from './lot.dto.js';
import type { SectorInput } from '../../../application/event-inputs.js';

export class CreateSectorDto implements SectorInput {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cada setor precisa ter pelo menos um lote.' })
  @ValidateNested({ each: true })
  @Type(() => CreateLotDto)
  @ApiProperty({ type: [CreateLotDto] })
  lots: CreateLotDto[];
}

export class UpdateSectorDto implements SectorInput {
  // Sem id, o setor é criado
  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  id?: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cada setor precisa ter pelo menos um lote.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateLotDto)
  @ApiProperty({ type: [UpdateLotDto] })
  lots: UpdateLotDto[];
}
