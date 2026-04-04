import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import {
  CatalogOverviewResponseDto,
  DeleteProductResponseDto,
  CategoryResponseDto,
  ProductResponseDto,
} from './dtos/catalog.responses';
import { BulkUpdateProductVisibilityDto } from './dtos/bulk-update-product-visibility.dto';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdateProductVisibilityDto } from './dtos/update-product-visibility.dto';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOperation({ summary: 'Visao geral do catalogo' })
  @ApiOkResponse({ type: CatalogOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.catalogService.getOverview();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar categorias do catalogo' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Criar categoria do catalogo' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.catalogService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remover categoria sem produtos vinculados' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiOkResponse({ type: DeleteProductResponseDto })
  @Delete('categories/:id')
  deleteCategory(@Param('id') categoryId: string) {
    return this.catalogService.deleteCategory(categoryId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar produtos do catalogo' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @Get('products')
  listProducts() {
    return this.catalogService.listProducts();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cadastrar produto com SKU principal' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
    return this.catalogService.createProduct(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obter um produto do catalogo' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Get('products/:id')
  getProduct(@Param('id') productId: string) {
    return this.catalogService.getProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Atualizar os dados do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Patch('products/:id')
  updateProduct(
    @Param('id') productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(productId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Atualizar destaque e publicacao do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Patch('products/:id/visibility')
  updateProductVisibility(
    @Param('id') productId: string,
    @Body() body: UpdateProductVisibilityDto,
  ) {
    return this.catalogService.updateProductVisibility(productId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Atualizar publicacao e destaque em lote' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @Patch('products/visibility/bulk')
  updateProductsVisibilityInBulk(@Body() body: BulkUpdateProductVisibilityDto) {
    return this.catalogService.updateProductsVisibilityInBulk(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Enviar imagens para um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({ type: ProductResponseDto })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Post('products/:id/images')
  uploadProductImages(
    @Param('id') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.catalogService.uploadProductImages(productId, files);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remover uma imagem do produto' })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  @ApiParam({ name: 'imageId', description: 'ID da imagem' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Delete('products/:productId/images/:imageId')
  removeProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.catalogService.removeProductImage(productId, imageId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remover produto e arquivos de imagem associados' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: DeleteProductResponseDto })
  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string) {
    return this.catalogService.deleteProduct(productId);
  }
}
