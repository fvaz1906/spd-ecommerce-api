import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

const shipmentStatusValues = ['PENDING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED'] as const;

export class UpdateOrderShipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional({ enum: shipmentStatusValues })
  @IsOptional()
  @IsEnum(shipmentStatusValues)
  status?: (typeof shipmentStatusValues)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  freightPriceInCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
