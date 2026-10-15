import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthLoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  // Token de 30 dias em vez de 1 hora
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  keepConnected?: boolean;
}
