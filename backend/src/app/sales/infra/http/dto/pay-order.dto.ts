import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import type { PayOrderInput } from '@golden-events/shared';

export class PayOrderDto implements PayOrderInput {
  @ApiProperty({ enum: ChargeMethod })
  @IsEnum(ChargeMethod)
  method: ChargeMethod;

  // Token do cartão gerado pelo provedor no navegador; o número do cartão nunca passa pela API.
  // No provedor fake, qualquer token é aprovado, menos tok_declined
  @ApiPropertyOptional()
  @ValidateIf(({ method }) => method === ChargeMethod.card)
  @IsString()
  @IsNotEmpty()
  paymentToken?: string;
}
