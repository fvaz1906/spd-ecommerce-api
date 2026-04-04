import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Copo termico 180ml' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'Copos' })
  @IsString()
  @MaxLength(100)
  categoryName!: string;

  @ApiProperty({ example: 'SPD-COPO-180-TR' })
  @IsString()
  @MaxLength(80)
  sku!: string;

  @ApiPropertyOptional({
    example: 'Resumo comercial para a listagem do produto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'Descricao detalhada do produto para PDP e SEO.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1890 })
  @IsInt()
  @Min(0)
  priceInCents!: number;

  @ApiPropertyOptional({ example: 2190 })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtCents?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;
}
