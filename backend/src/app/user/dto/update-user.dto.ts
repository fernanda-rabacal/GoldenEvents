import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@golden-events/shared';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserTypeEnum } from '../entities/user.entity.js';
import { PASSWORD_LENGTH_MESSAGE } from './create-user.dto.js';
import type { UpdateUserInput } from '../user-inputs.js';

export class UpdateUserDto implements UpdateUserInput {
  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsNumber()
  @IsOptional()
  @IsEnum(UserTypeEnum)
  @ApiProperty()
  userTypeId?: number;

  @IsString()
  @IsOptional()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_LENGTH_MESSAGE })
  @ApiProperty({ required: false })
  password?: string;

  // Obrigatória para trocar a própria senha: um token roubado não basta para tomar a conta
  @ValidateIf(({ password }) => password !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha atual para definir uma nova.' })
  @ApiProperty({ required: false })
  currentPassword?: string;
}
