import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  userTypeId: number;
}
