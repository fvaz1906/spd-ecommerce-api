import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const orderSourceValues = ['SYSTEM', 'ECOMMERCE', 'MARKETPLACE', 'WHATSAPP'] as const;
const paymentMethodValues = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'] as const;
const paymentStatusValues = ['PENDING', 'AUTHORIZED', 'PAID', 'REFUSED', 'REFUNDED', 'CANCELLED'] as const;
const shipmentStatusValues = ['PENDING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED'] as const;

class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  productVariantId!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 1990 })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitPriceInCents?: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsString()
  shippingAddressId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  freightRuleId?: string;

  @ApiProperty({ enum: orderSourceValues, example: 'SYSTEM' })
  @IsEnum(orderSourceValues)
  source!: (typeof orderSourceValues)[number];

  @ApiProperty({ enum: paymentMethodValues, example: 'PIX' })
  @IsEnum(paymentMethodValues)
  paymentMethod!: (typeof paymentMethodValues)[number];

  @ApiPropertyOptional({ enum: paymentStatusValues, example: 'PENDING' })
  @IsOptional()
  @IsEnum(paymentStatusValues)
  paymentStatus?: (typeof paymentStatusValues)[number];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountInCents?: number;

  @ApiPropertyOptional({ example: 2390 })
  @IsOptional()
  @IsInt()
  @Min(0)
  shippingInCents?: number;

  @ApiPropertyOptional({ example: 'Pedido criado pelo televendas.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Priorizar separacao.' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ example: 'SAME_DAY' })
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @ApiPropertyOptional({ example: 'Entrega expressa' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ enum: shipmentStatusValues, example: 'PENDING' })
  @IsOptional()
  @IsEnum(shipmentStatusValues)
  shipmentStatus?: (typeof shipmentStatusValues)[number];

  @ApiPropertyOptional({ example: 'TRK123456BR' })
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional({ example: '2026-04-08T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
