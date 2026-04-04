import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateStockMovementDto } from './dtos/create-stock-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [items, inventoryItems, sums] = await Promise.all([
      this.prisma.inventoryItem.count(),
      this.prisma.inventoryItem.findMany({
        select: {
          quantityOnHand: true,
          reorderLevel: true,
        },
      }),
      this.prisma.inventoryItem.aggregate({
        _sum: {
          quantityOnHand: true,
          quantityReserved: true,
        },
      }),
    ]);
    const lowStockCount = inventoryItems.filter(
      (item) => item.quantityOnHand <= item.reorderLevel,
    ).length;

    return {
      context: 'inventory',
      features: ['stock', 'movements', 'replenishment'],
      endpoints: [
        'GET /api/inventory/overview',
        'GET /api/inventory/items',
        'GET /api/inventory/movements',
        'POST /api/inventory/movements',
      ],
      monitoredSkus: items,
      lowStockCount,
      totalOnHand: sums._sum.quantityOnHand ?? 0,
      totalReserved: sums._sum.quantityReserved ?? 0,
    };
  }

  async listItems() {
    const items = await this.prisma.inventoryItem.findMany({
      orderBy: [{ quantityOnHand: 'asc' }, { updatedAt: 'desc' }],
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.variant.product.id,
      variantId: item.variant.id,
      productName: item.variant.product.name,
      sku: item.variant.sku,
      categoryName: item.variant.product.category.name,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      reorderLevel: item.reorderLevel,
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async listMovements() {
    const movements = await this.prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        inventoryItem: {
          select: {
            id: true,
            variant: {
              select: {
                sku: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      inventoryItemId: movement.inventoryItemId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString(),
      productName: movement.inventoryItem.variant.product.name,
      sku: movement.inventoryItem.variant.sku,
    }));
  }

  async createMovement(input: CreateStockMovementDto) {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: {
        variant: {
          select: {
            sku: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Item de estoque nao encontrado.');
    }

    const nextState = this.calculateNextState(
      inventoryItem.quantityOnHand,
      inventoryItem.quantityReserved,
      input.type,
      input.quantity,
    );

    const movement = await this.prisma.$transaction(async (transaction) => {
      await transaction.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantityOnHand: nextState.quantityOnHand,
          quantityReserved: nextState.quantityReserved,
        },
      });

      return transaction.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason.trim(),
        },
      });
    });

    return {
      id: movement.id,
      inventoryItemId: movement.inventoryItemId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString(),
      productName: inventoryItem.variant.product.name,
      sku: inventoryItem.variant.sku,
    };
  }

  private calculateNextState(
    quantityOnHand: number,
    quantityReserved: number,
    type: StockMovementType,
    quantity: number,
  ) {
    if (quantity === 0) {
      throw new BadRequestException('A quantidade deve ser diferente de zero.');
    }

    switch (type) {
      case StockMovementType.IN:
        if (quantity < 0) {
          throw new BadRequestException(
            'Movimentacoes de entrada devem usar quantidade positiva.',
          );
        }
        return {
          quantityOnHand: quantityOnHand + quantity,
          quantityReserved,
        };
      case StockMovementType.OUT:
        if (quantity < 0) {
          throw new BadRequestException(
            'Movimentacoes de saida devem usar quantidade positiva.',
          );
        }
        if (quantityOnHand < quantity) {
          throw new BadRequestException(
            'Saldo insuficiente para registrar a saida.',
          );
        }
        return {
          quantityOnHand: quantityOnHand - quantity,
          quantityReserved,
        };
      case StockMovementType.RESERVED:
        if (quantity < 0) {
          throw new BadRequestException(
            'Reservas devem usar quantidade positiva.',
          );
        }
        if (quantityOnHand < quantity) {
          throw new BadRequestException(
            'Saldo insuficiente para reservar essa quantidade.',
          );
        }
        return {
          quantityOnHand: quantityOnHand - quantity,
          quantityReserved: quantityReserved + quantity,
        };
      case StockMovementType.RELEASED:
        if (quantity < 0) {
          throw new BadRequestException(
            'Liberacoes devem usar quantidade positiva.',
          );
        }
        if (quantityReserved < quantity) {
          throw new BadRequestException(
            'Nao ha reserva suficiente para liberar essa quantidade.',
          );
        }
        return {
          quantityOnHand: quantityOnHand + quantity,
          quantityReserved: quantityReserved - quantity,
        };
      case StockMovementType.ADJUSTMENT:
        if (quantityOnHand + quantity < 0) {
          throw new BadRequestException('O ajuste deixaria o saldo negativo.');
        }
        return {
          quantityOnHand: quantityOnHand + quantity,
          quantityReserved,
        };
      default:
        return {
          quantityOnHand,
          quantityReserved,
        };
    }
  }
}
