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

  // Refresh token de 30 dias em vez de 1 dia
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  keepConnected?: boolean;
}
