import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserTypeEnum } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  name: string;

  @IsNumber()
  @IsOptional()
  @IsEnum(UserTypeEnum)
  @ApiProperty()
  userTypeId: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  password: string;
}
