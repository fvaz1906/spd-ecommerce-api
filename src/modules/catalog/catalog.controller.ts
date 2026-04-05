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
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '@/core/security/roles.decorator';
import { RolesGuard } from '@/core/security/roles.guard';
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
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOperation({ summary: 'Visao geral do catalogo' })
  @ApiOkResponse({ type: CatalogOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.catalogService.getOverview();
  }

  @ApiOperation({ summary: 'Listar categorias do catalogo' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @ApiOperation({ summary: 'Criar categoria do catalogo' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.catalogService.createCategory(body);
  }

  @ApiOperation({ summary: 'Remover categoria sem produtos vinculados' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiOkResponse({ type: DeleteProductResponseDto })
  @Delete('categories/:id')
  deleteCategory(@Param('id') categoryId: string) {
    return this.catalogService.deleteCategory(categoryId);
  }

  @ApiOperation({ summary: 'Listar produtos do catalogo' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @Get('products')
  listProducts() {
    return this.catalogService.listProducts();
  }

  @ApiOperation({ summary: 'Cadastrar produto com SKU principal' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
    return this.catalogService.createProduct(body);
  }

  @ApiOperation({ summary: 'Obter um produto do catalogo' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Get('products/:id')
  getProduct(@Param('id') productId: string) {
    return this.catalogService.getProduct(productId);
  }

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

  @ApiOperation({ summary: 'Atualizar publicacao e destaque em lote' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @Patch('products/visibility/bulk')
  updateProductsVisibilityInBulk(@Body() body: BulkUpdateProductVisibilityDto) {
    return this.catalogService.updateProductsVisibilityInBulk(body);
  }

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

  @ApiOperation({ summary: 'Remover produto e arquivos de imagem associados' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ type: DeleteProductResponseDto })
  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string) {
    return this.catalogService.deleteProduct(productId);
  }
}
