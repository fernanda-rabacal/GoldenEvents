import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@golden-events/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export const PASSWORD_LENGTH_MESSAGE = `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_LENGTH_MESSAGE })
  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  password: string;

  // Aceita o CPF com ou sem máscara e guarda só os dígitos
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(/^\d{11}$/, { message: 'O CPF deve ter 11 números.' })
  @ApiProperty({ example: '12345678901' })
  document: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isOrganizer?: boolean;
}
