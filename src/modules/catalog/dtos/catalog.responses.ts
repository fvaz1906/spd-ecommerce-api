import { ApiProperty } from '@nestjs/swagger';

export class CatalogOverviewResponseDto {
  @ApiProperty({ example: 'catalog' })
  context!: string;

  @ApiProperty({
    type: [String],
    example: ['categories', 'products', 'images'],
  })
  features!: string[];

  @ApiProperty({
    type: [String],
    example: [
      'GET /api/catalog/overview',
      'GET /api/catalog/products',
      'POST /api/catalog/products',
    ],
  })
  endpoints!: string[];
}

export class ProductImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  filename!: string;

  @ApiProperty({ nullable: true })
  altText!: string | null;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  isPrimary!: boolean;
}

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  productsCount!: number;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty({ nullable: true })
  shortDescription!: string | null;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  priceInCents!: number;

  @ApiProperty({ nullable: true })
  compareAtCents!: number | null;

  @ApiProperty()
  quantityOnHand!: number;

  @ApiProperty()
  reorderLevel!: number;

  @ApiProperty({ type: [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiProperty()
  createdAt!: string;
}

export class DeleteProductResponseDto {
  @ApiProperty({ example: 'Produto removido com sucesso.' })
  message!: string;
}
