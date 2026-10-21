import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@golden-events/shared';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  Length,
} from 'class-validator';

import type { CreateUserInput } from '../user-inputs.js';
import { IsCpf } from '../../common/http/is-cpf.decorator.js';

export const PASSWORD_LENGTH_MESSAGE = `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;

export class CreateUserDto implements CreateUserInput {
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

  @IsCpf()
  document: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isOrganizer?: boolean;
}
