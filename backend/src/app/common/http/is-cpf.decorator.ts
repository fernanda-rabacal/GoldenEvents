import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

// Aceita o CPF com ou sem máscara e guarda só os dígitos
export function IsCpf() {
  return applyDecorators(
    Transform(({ value }) =>
      typeof value === 'string' ? value.replace(/\D/g, '') : value,
    ),
    IsString(),
    Matches(/^\d{11}$/, { message: 'O CPF deve ter 11 números.' }),
    ApiProperty({ example: '12345678901' }),
  );
}
