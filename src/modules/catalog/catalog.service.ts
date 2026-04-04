import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Product, ProductImage, ProductVariant } from '@prisma/client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { R2StorageService } from './r2-storage.service';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdateProductVisibilityDto } from './dtos/update-product-visibility.dto';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { BulkUpdateProductVisibilityDto } from './dtos/bulk-update-product-visibility.dto';

type ProductRecord = Product & {
  category: { name: string };
  images: ProductImage[];
  variants: Array<
    ProductVariant & {
      inventoryItem: {
        quantityOnHand: number;
        reorderLevel: number;
      } | null;
    }
  >;
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  getOverview() {
    return {
      context: 'catalog',
      features: ['categories', 'products', 'variants', 'images'],
      endpoints: [
        'GET /api/catalog/overview',
        'GET /api/catalog/products',
        'GET /api/catalog/products/:id',
        'POST /api/catalog/products',
        'PATCH /api/catalog/products/:id',
        'PATCH /api/catalog/products/:id/visibility',
        'GET /api/catalog/categories',
        'POST /api/catalog/categories',
        'DELETE /api/catalog/categories/:id',
        'POST /api/catalog/products/:id/images',
        'DELETE /api/catalog/products/:productId/images/:imageId',
        'DELETE /api/catalog/products/:id',
      ],
    };
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            inventoryItem: {
              select: { quantityOnHand: true, reorderLevel: true },
            },
          },
        },
      },
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productsCount: category._count.products,
    }));
  }

  async createCategory(input: CreateCategoryDto) {
    const normalizedName = input.name.trim();
    const slug = this.slugify(normalizedName);

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (existingCategory) {
      return {
        id: existingCategory.id,
        name: existingCategory.name,
        slug: existingCategory.slug,
        description: existingCategory.description,
        productsCount: existingCategory._count.products,
      };
    }

    const category = await this.prisma.category.create({
      data: {
        name: normalizedName,
        slug,
        description: input.description?.trim() || null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productsCount: category._count.products,
    };
  }

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria nao encontrada.');
    }

    if (category._count.products > 0) {
      throw new BadRequestException(
        'Nao e possivel remover uma categoria vinculada a produtos.',
      );
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return {
      message: 'Categoria removida com sucesso.',
    };
  }

  async getProduct(productId: string) {
    return this.getProductOrFail(productId);
  }

  async createProduct(input: CreateProductDto) {
    const normalizedSku = input.sku.trim().toUpperCase();
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: normalizedSku },
    });

    if (existingProduct) {
      throw new BadRequestException('Ja existe um produto com esse SKU.');
    }

    const category = await this.ensureCategory(input.categoryName);
    const slug = await this.generateUniqueSlug(input.name);

    const product = await this.prisma.product.create({
      data: {
        categoryId: category.id,
        name: input.name.trim(),
        slug,
        sku: normalizedSku,
        shortDescription: input.shortDescription?.trim() || null,
        description: input.description?.trim() || null,
        status: 'DRAFT',
        isFeatured: false,
        variants: {
          create: {
            name: 'Padrao',
            sku: normalizedSku,
            priceInCents: input.priceInCents,
            compareAtCents: input.compareAtCents ?? null,
            inventoryItem: {
              create: {
                quantityOnHand: input.quantityOnHand ?? 0,
                reorderLevel: input.reorderLevel ?? 0,
              },
            },
          },
        },
      },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          take: 1,
          include: {
            inventoryItem: {
              select: { quantityOnHand: true, reorderLevel: true },
            },
          },
        },
      },
    });

    return this.toProductResponse(product);
  }

  async updateProduct(productId: string, input: UpdateProductDto) {
    const currentProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          take: 1,
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!currentProduct) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    const normalizedSku = input.sku?.trim().toUpperCase();

    if (normalizedSku && normalizedSku !== currentProduct.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: normalizedSku },
      });

      if (existingProduct && existingProduct.id !== productId) {
        throw new BadRequestException('Ja existe um produto com esse SKU.');
      }
    }

    const category = input.categoryName
      ? await this.ensureCategory(input.categoryName)
      : null;
    const nextName = input.name?.trim() ?? currentProduct.name;
    const nextSku = normalizedSku ?? currentProduct.sku;
    const primaryVariant = currentProduct.variants[0];

    await this.prisma.$transaction(async (transaction) => {
      await transaction.product.update({
        where: { id: productId },
        data: {
          name: nextName,
          slug:
            nextName !== currentProduct.name
              ? await this.generateUniqueSlug(nextName, productId)
              : currentProduct.slug,
          sku: nextSku,
          categoryId: category?.id ?? currentProduct.categoryId,
          shortDescription:
            input.shortDescription !== undefined
              ? input.shortDescription.trim() || null
              : undefined,
          description:
            input.description !== undefined
              ? input.description.trim() || null
              : undefined,
        },
      });

      if (primaryVariant) {
        await transaction.productVariant.update({
          where: { id: primaryVariant.id },
          data: {
            sku: nextSku,
            priceInCents: input.priceInCents ?? undefined,
            compareAtCents:
              input.compareAtCents !== undefined
                ? input.compareAtCents
                : undefined,
          },
        });

        if (primaryVariant.inventoryItem) {
          await transaction.inventoryItem.update({
            where: { id: primaryVariant.inventoryItem.id },
            data: {
              quantityOnHand:
                input.quantityOnHand !== undefined
                  ? input.quantityOnHand
                  : undefined,
              reorderLevel:
                input.reorderLevel !== undefined
                  ? input.reorderLevel
                  : undefined,
            },
          });
        }
      }
    });

    return this.getProductOrFail(productId);
  }

  async updateProductVisibility(
    productId: string,
    input: UpdateProductVisibilityDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        isFeatured: input.isFeatured ?? undefined,
        status: input.status ?? undefined,
      },
    });

    return this.getProductOrFail(productId);
  }

  async updateProductsVisibilityInBulk(input: BulkUpdateProductVisibilityDto) {
    if (input.isFeatured === undefined && input.status === undefined) {
      throw new BadRequestException(
        'Informe ao menos um campo para atualizar em lote.',
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: input.productIds },
      },
      select: { id: true },
    });

    if (products.length !== input.productIds.length) {
      throw new NotFoundException(
        'Um ou mais produtos selecionados nao foram encontrados.',
      );
    }

    await this.prisma.product.updateMany({
      where: {
        id: { in: input.productIds },
      },
      data: {
        isFeatured: input.isFeatured ?? undefined,
        status: input.status ?? undefined,
      },
    });

    const updatedProducts = await this.prisma.product.findMany({
      where: {
        id: { in: input.productIds },
      },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            inventoryItem: {
              select: { quantityOnHand: true, reorderLevel: true },
            },
          },
        },
      },
    });

    const responseById = new Map(
      updatedProducts.map((product) => [
        product.id,
        this.toProductResponse(product),
      ]),
    );

    return input.productIds
      .map((productId) => responseById.get(productId))
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      );
  }

  async uploadProductImages(productId: string, files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestException('Envie ao menos uma imagem do produto.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          take: 1,
          include: {
            inventoryItem: {
              select: { quantityOnHand: true, reorderLevel: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    files.forEach((file) => this.validateImage(file));

    let nextPosition = product.images.length;
    const hasPrimaryImage = product.images.some((image) => image.isPrimary);

    for (const [index, file] of files.entries()) {
      const uploadedImage = await this.r2StorageService.uploadProductImage({
        productId,
        file,
      });

      await this.prisma.productImage.create({
        data: {
          productId,
          url: uploadedImage.url,
          storageKey: uploadedImage.storageKey,
          filename: uploadedImage.filename,
          position: nextPosition,
          isPrimary: !hasPrimaryImage && index === 0,
        },
      });

      nextPosition += 1;
    }

    return this.getProductOrFail(productId);
  }

  async removeProductImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Imagem do produto nao encontrada.');
    }

    await this.r2StorageService.removeFile(image.storageKey);

    await this.prisma.productImage.delete({
      where: { id: image.id },
    });

    await this.reorderImages(productId);

    const remainingImages = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    if (
      remainingImages.length > 0 &&
      !remainingImages.some((item) => item.isPrimary)
    ) {
      await this.prisma.productImage.update({
        where: { id: remainingImages[0].id },
        data: { isPrimary: true },
      });
    }

    return this.getProductOrFail(productId);
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: {
          include: {
            inventoryItem: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    if (product.images.length > 0) {
      await this.r2StorageService.removeFiles(
        product.images.map((image) => image.storageKey),
      );
    }

    const inventoryIds = product.variants
      .map((variant) => variant.inventoryItem?.id)
      .filter((item): item is string => Boolean(item));
    const variantIds = product.variants.map((variant) => variant.id);

    await this.prisma.$transaction(async (transaction) => {
      if (inventoryIds.length > 0) {
        await transaction.stockMovement.deleteMany({
          where: { inventoryItemId: { in: inventoryIds } },
        });

        await transaction.inventoryItem.deleteMany({
          where: { id: { in: inventoryIds } },
        });
      }

      if (variantIds.length > 0) {
        await transaction.productVariant.deleteMany({
          where: { id: { in: variantIds } },
        });
      }

      await transaction.productImage.deleteMany({
        where: { productId },
      });

      await transaction.product.delete({
        where: { id: productId },
      });
    });

    return {
      message: 'Produto removido com sucesso.',
    };
  }

  private async getProductOrFail(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            inventoryItem: {
              select: { quantityOnHand: true, reorderLevel: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    return this.toProductResponse(product);
  }

  private async reorderImages(productId: string) {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    await Promise.all(
      images.map((image, index) =>
        this.prisma.productImage.update({
          where: { id: image.id },
          data: {
            position: index,
            isPrimary: index === 0 ? image.isPrimary : false,
          },
        }),
      ),
    );
  }

  private validateImage(file: Express.Multer.File) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Apenas arquivos de imagem sao permitidos.',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Cada imagem deve ter no maximo 5 MB.');
    }
  }

  private async ensureCategory(categoryName: string) {
    const normalizedName = categoryName.trim();
    const baseSlug = this.slugify(normalizedName);
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: baseSlug },
    });

    if (existingCategory) {
      return existingCategory;
    }

    return this.prisma.category.create({
      data: {
        name: normalizedName,
        slug: baseSlug,
      },
    });
  }

  private async generateUniqueSlug(name: string, excludeProductId?: string) {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (!existingProduct || existingProduct.id === excludeProductId) {
        return slug;
      }

      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private toProductResponse(product: ProductRecord) {
    const primaryVariant = product.variants[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      isFeatured: product.isFeatured,
      categoryName: product.category.name,
      shortDescription: product.shortDescription,
      description: product.description,
      priceInCents: primaryVariant?.priceInCents ?? 0,
      compareAtCents: primaryVariant?.compareAtCents ?? null,
      quantityOnHand: primaryVariant?.inventoryItem?.quantityOnHand ?? 0,
      reorderLevel: primaryVariant?.inventoryItem?.reorderLevel ?? 0,
      images: product.images.map((image) => ({
        id: image.id,
        url: this.r2StorageService.resolveFileUrl(image.storageKey),
        filename: image.filename,
        altText: image.altText,
        position: image.position,
        isPrimary: image.isPrimary,
      })),
      createdAt: product.createdAt.toISOString(),
    };
  }
}
