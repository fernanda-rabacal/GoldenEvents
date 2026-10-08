import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateEventDto } from './create-event.dto.js';
import { UpdateSectorDto } from './sector.dto.js';

export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['sectors'] as const),
) {
  // Ausente mantém os setores atuais; enviado, substitui a lista inteira
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'O evento precisa ter pelo menos um setor.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateSectorDto)
  @ApiProperty({ type: [UpdateSectorDto], required: false })
  sectors?: UpdateSectorDto[];
}
