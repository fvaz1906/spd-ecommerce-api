import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkUpdateProductVisibilityDto {
  @ApiProperty({
    type: [String],
    example: ['clx123', 'clx456'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds!: string[];

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    required: false,
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
