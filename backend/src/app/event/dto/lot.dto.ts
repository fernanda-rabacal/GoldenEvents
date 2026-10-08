import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLotDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'Preço em centavos' })
  price: number;

  @IsInt()
  @Min(1)
  @ApiProperty()
  quantity: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @ApiProperty({ required: false, nullable: true })
  salesStart?: Date | null;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @ApiProperty({ required: false, nullable: true })
  salesEnd?: Date | null;
}

export class UpdateLotDto extends CreateLotDto {
  // Sem id, o lote é criado
  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  id?: number;
}
