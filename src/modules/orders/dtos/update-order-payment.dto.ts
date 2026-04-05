import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

const paymentMethodValues = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'] as const;
const paymentStatusValues = ['PENDING', 'AUTHORIZED', 'PAID', 'REFUSED', 'REFUNDED', 'CANCELLED'] as const;

export class UpdateOrderPaymentDto {
  @ApiPropertyOptional({ enum: paymentMethodValues })
  @IsOptional()
  @IsEnum(paymentMethodValues)
  method?: (typeof paymentMethodValues)[number];

  @ApiPropertyOptional({ enum: paymentStatusValues })
  @IsOptional()
  @IsEnum(paymentStatusValues)
  status?: (typeof paymentStatusValues)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
