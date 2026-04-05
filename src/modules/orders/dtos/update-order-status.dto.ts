import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const orderStatusValues = [
  'PENDING',
  'CONFIRMED',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: orderStatusValues, example: 'PROCESSING' })
  @IsEnum(orderStatusValues)
  status!: (typeof orderStatusValues)[number];
}
