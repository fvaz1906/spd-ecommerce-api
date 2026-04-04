import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCarrierFreightRuleDto {
  @ApiProperty({ example: 'Caixa pequena ate 3kg' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'EXPRESSO' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  serviceCode?: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minWeightGrams!: number;

  @ApiProperty({ example: 3000 })
  @IsInt()
  @Min(1)
  maxWeightGrams!: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minLengthCm!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  maxLengthCm!: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minWidthCm!: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  maxWidthCm!: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minHeightCm!: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  maxHeightCm!: number;

  @ApiProperty({ example: 2490 })
  @IsInt()
  @Min(0)
  baseFreightCostInCents!: number;

  @ApiPropertyOptional({ example: 550 })
  @IsOptional()
  @IsInt()
  @Min(0)
  additionalCostPerKgInCents?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryDays?: number;
}
