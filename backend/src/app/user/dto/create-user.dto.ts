import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, Length, IsString } from 'class-validator';

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
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsString()
  @Length(11, 11)
  @ApiProperty()
  document: string;
}
