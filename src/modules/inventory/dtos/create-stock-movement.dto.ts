import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inventoryItemId!: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty({ example: 10 })
  @IsInt()
  quantity!: number;

  @ApiProperty({ example: 'Compra fornecedor' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
