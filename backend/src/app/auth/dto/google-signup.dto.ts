import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsCpf } from '../../common/http/is-cpf.decorator.js';

export class GoogleSignupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  signupToken: string;

  @IsCpf()
  document: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isOrganizer?: boolean;
}
