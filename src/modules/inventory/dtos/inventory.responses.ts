import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class InventoryOverviewResponseDto {
  @ApiProperty({ example: 'inventory' })
  context!: string;

  @ApiProperty({
    type: [String],
    example: ['stock', 'movements', 'replenishment'],
  })
  features!: string[];

  @ApiProperty({
    type: [String],
    example: [
      'GET /api/inventory/overview',
      'GET /api/inventory/items',
      'POST /api/inventory/movements',
    ],
  })
  endpoints!: string[];

  @ApiProperty()
  monitoredSkus!: number;

  @ApiProperty()
  lowStockCount!: number;

  @ApiProperty()
  totalOnHand!: number;

  @ApiProperty()
  totalReserved!: number;
}

export class InventoryItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  quantityOnHand!: number;

  @ApiProperty()
  quantityReserved!: number;

  @ApiProperty()
  reorderLevel!: number;

  @ApiProperty()
  updatedAt!: string;
}

export class StockMovementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  inventoryItemId!: string;

  @ApiProperty({ enum: StockMovementType })
  type!: StockMovementType;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  sku!: string;
}
