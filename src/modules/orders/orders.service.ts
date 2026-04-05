import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CarrierStatus,
  Order,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ProductStatus,
  ShipmentStatus,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderPaymentDto } from './dtos/update-order-payment.dto';
import { UpdateOrderShipmentDto } from './dtos/update-order-shipment.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';

type OrderTx = Prisma.TransactionClient;
type AddressSnapshot = {
  id: string;
  label: string;
  recipient: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [orders, revenue] = await Promise.all([
      this.prisma.order.findMany({ select: { status: true } }),
      this.prisma.order.aggregate({
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PROCESSING,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ],
          },
        },
        _sum: { totalInCents: true },
      }),
    ]);

    return {
      context: 'orders',
      features: ['orders', 'items', 'payments', 'shipments'],
      endpoints: [
        'GET /api/orders/overview',
        'GET /api/orders/creation-options',
        'GET /api/orders',
        'GET /api/orders/:id',
        'POST /api/orders',
        'PATCH /api/orders/:id/status',
        'PATCH /api/orders/:id/payment',
        'PATCH /api/orders/:id/shipment',
      ],
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        (order) =>
          order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.CONFIRMED,
      ).length,
      paidOrders: orders.filter(
        (order) =>
          order.status === OrderStatus.PAID ||
          order.status === OrderStatus.PROCESSING ||
          order.status === OrderStatus.SHIPPED ||
          order.status === OrderStatus.DELIVERED,
      ).length,
      shippedOrders: orders.filter(
        (order) =>
          order.status === OrderStatus.SHIPPED ||
          order.status === OrderStatus.DELIVERED,
      ).length,
      revenueInCents: revenue._sum.totalInCents ?? 0,
    };
  }

  async getCreationOptions() {
    const [customers, carriers, products] = await Promise.all([
      this.prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          contacts: {
            where: { isActive: true },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
          addresses: {
            where: { isActive: true },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      }),
      this.prisma.carrier.findMany({
        where: { status: CarrierStatus.ACTIVE },
        orderBy: { name: 'asc' },
        include: {
          freightRules: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.product.findMany({
        where: { status: { in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] } },
        orderBy: { name: 'asc' },
        include: {
          category: { select: { name: true } },
          variants: {
            orderBy: { createdAt: 'asc' },
            include: { inventoryItem: true },
          },
        },
      }),
    ]);

    return {
      customers: customers
        .filter((customer) => customer.addresses.length > 0)
        .map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          document: customer.document,
          phone: customer.phone,
          contacts: customer.contacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            isPrimary: contact.isPrimary,
          })),
          addresses: customer.addresses.map((address) => ({
            id: address.id,
            label: address.label,
            recipient: address.recipient,
            zipCode: address.zipCode,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            country: address.country,
            isPrimary: address.isPrimary,
          })),
        })),
      carriers: carriers.map((carrier) => ({
        id: carrier.id,
        name: carrier.name,
        averageFreightCostInCents: carrier.averageFreightCostInCents,
        freightRules: carrier.freightRules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          serviceCode: rule.serviceCode,
          minWeightGrams: rule.minWeightGrams,
          maxWeightGrams: rule.maxWeightGrams,
          baseFreightCostInCents: rule.baseFreightCostInCents,
          additionalCostPerKgInCents: rule.additionalCostPerKgInCents,
          deliveryDays: rule.deliveryDays,
        })),
      })),
      products: products.flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          productName: product.name,
          categoryName: product.category.name,
          variantId: variant.id,
          variantName: variant.name,
          sku: variant.sku,
          priceInCents: variant.priceInCents,
          compareAtCents: variant.compareAtCents,
          quantityOnHand: variant.inventoryItem?.quantityOnHand ?? 0,
          quantityReserved: variant.inventoryItem?.quantityReserved ?? 0,
          reorderLevel: variant.inventoryItem?.reorderLevel ?? 0,
        })),
      ),
      paymentMethods: Object.values(PaymentMethod),
      orderSources: Object.values(OrderSource),
    };
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.orderInclude,
    });

    return orders.map((order) => this.toOrderResponse(order as OrderWithRelations));
  }

  async getOrderById(orderId: string) {
    const order = await this.findOrderOrFail(orderId);
    return this.toOrderResponse(order);
  }

  async createOrder(input: CreateOrderDto) {
    this.validateOrderItems(input.items);

    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
      include: { addresses: { where: { isActive: true } } },
    });

    if (!customer || !customer.isActive) {
      throw new NotFoundException('Cliente ativo nao encontrado.');
    }

    const shippingAddress = customer.addresses.find((item) => item.id === input.shippingAddressId);
    if (!shippingAddress) {
      throw new BadRequestException('Endereco de entrega nao encontrado para este cliente.');
    }

    const billingAddress = input.billingAddressId
      ? customer.addresses.find((item) => item.id === input.billingAddressId)
      : shippingAddress;
    if (!billingAddress) {
      throw new BadRequestException('Endereco de cobranca nao encontrado para este cliente.');
    }

    const carrier = input.carrierId
      ? await this.prisma.carrier.findFirst({
          where: { id: input.carrierId, status: CarrierStatus.ACTIVE },
          include: { freightRules: true },
        })
      : null;
    if (input.carrierId && !carrier) {
      throw new NotFoundException('Transportadora ativa nao encontrada.');
    }

    const freightRule =
      input.freightRuleId && carrier
        ? carrier.freightRules.find((rule) => rule.id === input.freightRuleId && rule.isActive)
        : null;
    if (input.freightRuleId && !freightRule) {
      throw new BadRequestException('Regra de frete nao encontrada para a transportadora informada.');
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: input.items.map((item) => item.productVariantId) } },
      include: {
        product: { select: { id: true, name: true, status: true } },
        inventoryItem: true,
      },
    });
    if (variants.length !== input.items.length) {
      throw new NotFoundException('Um ou mais produtos do pedido nao foram encontrados.');
    }

    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
    const enrichedItems = input.items.map((item) => {
      const variant = variantsById.get(item.productVariantId);
      if (!variant) {
        throw new NotFoundException('Produto do pedido nao encontrado.');
      }
      if (variant.product.status === ProductStatus.ARCHIVED) {
        throw new BadRequestException(`O produto ${variant.product.name} esta arquivado.`);
      }
      if (!variant.inventoryItem) {
        throw new BadRequestException(`O produto ${variant.product.name} nao possui controle de estoque.`);
      }
      if (variant.inventoryItem.quantityOnHand < item.quantity) {
        throw new BadRequestException(`Saldo insuficiente para ${variant.product.name}.`);
      }
      const unitPriceInCents = item.unitPriceInCents ?? variant.priceInCents;
      return {
        item,
        variant,
        unitPriceInCents,
        totalPriceInCents: unitPriceInCents * item.quantity,
      };
    });

    const subtotalInCents = enrichedItems.reduce((sum, entry) => sum + entry.totalPriceInCents, 0);
    const discountInCents = input.discountInCents ?? 0;
    const shippingInCents =
      input.shippingInCents ??
      freightRule?.baseFreightCostInCents ??
      carrier?.averageFreightCostInCents ??
      0;
    const totalInCents = subtotalInCents - discountInCents + shippingInCents;
    if (totalInCents < 0) {
      throw new BadRequestException('O total do pedido nao pode ficar negativo.');
    }

    const itemsCount = enrichedItems.reduce((sum, entry) => sum + entry.item.quantity, 0);
    const code = await this.generateOrderCode();
    const paymentStatus = input.paymentStatus ?? PaymentStatus.PENDING;
    const shippingAddressSnapshot = this.toAddressSnapshot(shippingAddress);
    const billingAddressSnapshot = this.toAddressSnapshot(billingAddress);

    const order = await this.prisma.$transaction(async (transaction) => {
      const createdOrder = await transaction.order.create({
        data: {
          customerId: customer.id,
          code,
          source: input.source,
          status: paymentStatus === PaymentStatus.PAID ? OrderStatus.PAID : OrderStatus.CONFIRMED,
          customerName: customer.name,
          customerEmail: customer.email,
          customerDocument: customer.document,
          customerPhone: customer.phone,
          itemsCount,
          subtotalInCents,
          discountInCents,
          shippingInCents,
          totalInCents,
          notes: input.notes?.trim() || null,
          internalNotes: input.internalNotes?.trim() || null,
          shippingAddressSnapshot,
          billingAddressSnapshot,
          items: {
            create: enrichedItems.map(({ item, variant, unitPriceInCents, totalPriceInCents }) => ({
              productVariantId: variant.id,
              productName: variant.product.name,
              variantName: variant.name,
              quantity: item.quantity,
              unitPriceInCents,
              totalPriceInCents,
            })),
          },
          paymentTransactions: {
            create: {
              method: input.paymentMethod,
              status: paymentStatus,
              amountInCents: totalInCents,
              installments: input.installments ?? null,
              paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
            },
          },
          shipments: {
            create: {
              carrierId: carrier?.id ?? null,
              carrier: carrier?.name ?? null,
              carrierName: carrier?.name ?? null,
              serviceCode: input.serviceCode?.trim() || freightRule?.serviceCode || null,
              serviceName: input.serviceName?.trim() || freightRule?.name || null,
              trackingCode: input.trackingCode?.trim() || null,
              recipient: shippingAddress.recipient,
              zipCode: shippingAddress.zipCode,
              city: shippingAddress.city,
              state: shippingAddress.state,
              status: input.shipmentStatus ?? ShipmentStatus.PENDING,
              freightPriceInCents: shippingInCents,
              estimatedDeliveryAt: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt) : null,
            },
          },
        },
      });

      for (const { item, variant } of enrichedItems) {
        await transaction.inventoryItem.update({
          where: { id: variant.inventoryItem!.id },
          data: {
            quantityOnHand: { decrement: item.quantity },
            quantityReserved: { increment: item.quantity },
          },
        });
        await transaction.stockMovement.create({
          data: {
            inventoryItemId: variant.inventoryItem!.id,
            type: StockMovementType.RESERVED,
            quantity: item.quantity,
            reason: `Reserva para pedido ${code}`,
          },
        });
      }

      return createdOrder;
    });

    return this.getOrderById(order.id);
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusDto) {
    const order = await this.findOrderOrFail(orderId);
    if (order.status === input.status) {
      return this.toOrderResponse(order);
    }

    await this.prisma.$transaction(async (transaction) => {
      if (input.status === OrderStatus.CANCELLED) {
        this.ensureOrderCanBeCancelled(order);
        await this.releaseReservedInventory(transaction, order, `Cancelamento do pedido ${order.code}`);
        await transaction.paymentTransaction.updateMany({
          where: { orderId },
          data: { status: PaymentStatus.CANCELLED },
        });
        await transaction.shipment.updateMany({
          where: { orderId },
          data: { status: ShipmentStatus.CANCELLED },
        });
      }

      if (
        input.status === OrderStatus.SHIPPED ||
        input.status === OrderStatus.DELIVERED
      ) {
        await this.fulfillReservedInventory(transaction, order, `Faturamento do pedido ${order.code}`);
        await transaction.shipment.updateMany({
          where: { orderId },
          data: {
            status: input.status === OrderStatus.DELIVERED ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT,
            shippedAt: new Date(),
            deliveredAt: input.status === OrderStatus.DELIVERED ? new Date() : undefined,
          },
        });
      }

      if (input.status === OrderStatus.PAID) {
        await transaction.paymentTransaction.updateMany({
          where: { orderId },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });
      }

      if (input.status === OrderStatus.REFUNDED) {
        await transaction.paymentTransaction.updateMany({
          where: { orderId },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      await transaction.order.update({ where: { id: orderId }, data: { status: input.status } });
    });

    return this.getOrderById(orderId);
  }

  async updateOrderPayment(orderId: string, input: UpdateOrderPaymentDto) {
    await this.findOrderOrFail(orderId);
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    if (!payment) {
      throw new NotFoundException('Pagamento do pedido nao encontrado.');
    }

    await this.prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        method: input.method,
        status: input.status,
        externalReference:
          input.externalReference !== undefined ? input.externalReference.trim() || null : undefined,
        installments: input.installments ?? undefined,
        paidAt:
          input.paidAt !== undefined
            ? input.paidAt
              ? new Date(input.paidAt)
              : null
            : input.status === PaymentStatus.PAID
              ? new Date()
              : undefined,
      },
    });

    if (input.status === PaymentStatus.PAID) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });
    }

    return this.getOrderById(orderId);
  }

  async updateOrderShipment(orderId: string, input: UpdateOrderShipmentDto) {
    const order = await this.findOrderOrFail(orderId);
    let carrierName: string | null | undefined = undefined;

    if (input.carrierId) {
      const carrier = await this.prisma.carrier.findFirst({
        where: { id: input.carrierId, status: CarrierStatus.ACTIVE },
      });
      if (!carrier) {
        throw new NotFoundException('Transportadora ativa nao encontrada.');
      }
      carrierName = carrier.name;
    }

    const shipment = order.shipments[0];
    if (shipment) {
      await this.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          carrierId: input.carrierId ?? undefined,
          carrier: carrierName ?? undefined,
          carrierName: carrierName ?? undefined,
          serviceCode: input.serviceCode !== undefined ? input.serviceCode.trim() || null : undefined,
          serviceName: input.serviceName !== undefined ? input.serviceName.trim() || null : undefined,
          trackingCode: input.trackingCode !== undefined ? input.trackingCode.trim() || null : undefined,
          status: input.status ?? undefined,
          freightPriceInCents: input.freightPriceInCents ?? undefined,
          estimatedDeliveryAt:
            input.estimatedDeliveryAt !== undefined
              ? input.estimatedDeliveryAt
                ? new Date(input.estimatedDeliveryAt)
                : null
              : undefined,
          shippedAt: input.status === ShipmentStatus.IN_TRANSIT ? new Date() : undefined,
          deliveredAt: input.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
        },
      });
    }

    if (
      input.status === ShipmentStatus.IN_TRANSIT ||
      input.status === ShipmentStatus.DELIVERED
    ) {
      await this.fulfillReservedInventory(this.prisma as unknown as OrderTx, order, `Saida para expedicao do pedido ${order.code}`);
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: input.status === ShipmentStatus.DELIVERED ? OrderStatus.DELIVERED : OrderStatus.SHIPPED,
        },
      });
    }

    return this.getOrderById(orderId);
  }

  private get orderInclude() {
    return {
      items: { orderBy: { id: 'asc' as const } },
      paymentTransactions: { orderBy: { createdAt: 'asc' as const } },
      shipments: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private async findOrderOrFail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });
    if (!order) {
      throw new NotFoundException('Pedido nao encontrado.');
    }
    return order as OrderWithRelations;
  }

  private validateOrderItems(items: CreateOrderDto['items']) {
    const ids = items.map((item) => item.productVariantId);
    if (ids.length !== new Set(ids).size) {
      throw new BadRequestException('Nao repita o mesmo produto no pedido.');
    }
  }

  private ensureOrderCanBeCancelled(order: OrderWithRelations) {
    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException('Pedidos enviados ou entregues nao podem ser cancelados automaticamente pelo modulo.');
    }
  }

  private async releaseReservedInventory(transaction: OrderTx, order: OrderWithRelations, reason: string) {
    for (const item of order.items) {
      const inventoryItem = await transaction.inventoryItem.findUnique({
        where: { variantId: item.productVariantId },
      });
      if (!inventoryItem || inventoryItem.quantityReserved <= 0) {
        continue;
      }
      const quantity = Math.min(inventoryItem.quantityReserved, item.quantity);
      await transaction.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantityOnHand: { increment: quantity },
          quantityReserved: { decrement: quantity },
        },
      });
      await transaction.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: StockMovementType.RELEASED,
          quantity,
          reason,
        },
      });
    }
  }

  private async fulfillReservedInventory(transaction: OrderTx, order: OrderWithRelations, reason: string) {
    for (const item of order.items) {
      const inventoryItem = await transaction.inventoryItem.findUnique({
        where: { variantId: item.productVariantId },
      });
      if (!inventoryItem || inventoryItem.quantityReserved <= 0) {
        continue;
      }
      const quantity = Math.min(inventoryItem.quantityReserved, item.quantity);
      await transaction.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantityReserved: { decrement: quantity } },
      });
      await transaction.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: StockMovementType.FULFILLED,
          quantity,
          reason,
        },
      });
    }
  }

  private toAddressSnapshot(address: AddressSnapshot): AddressSnapshot {
    return { ...address };
  }

  private toOrderResponse(order: OrderWithRelations) {
    return {
      id: order.id,
      code: order.code,
      status: order.status,
      source: order.source,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerDocument: order.customerDocument,
      customerPhone: order.customerPhone,
      itemsCount: order.itemsCount,
      subtotalInCents: order.subtotalInCents,
      discountInCents: order.discountInCents,
      shippingInCents: order.shippingInCents,
      totalInCents: order.totalInCents,
      notes: order.notes,
      internalNotes: order.internalNotes,
      shippingAddress: order.shippingAddressSnapshot,
      billingAddress: order.billingAddressSnapshot,
      items: order.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
        totalPriceInCents: item.totalPriceInCents,
      })),
      payments: order.paymentTransactions.map((payment) => ({
        id: payment.id,
        method: payment.method,
        status: payment.status,
        externalReference: payment.externalReference,
        amountInCents: payment.amountInCents,
        installments: payment.installments,
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        createdAt: payment.createdAt.toISOString(),
      })),
      shipments: order.shipments.map((shipment) => ({
        id: shipment.id,
        carrierId: shipment.carrierId,
        carrierName: shipment.carrierName ?? shipment.carrier,
        serviceCode: shipment.serviceCode,
        serviceName: shipment.serviceName,
        trackingCode: shipment.trackingCode,
        recipient: shipment.recipient,
        zipCode: shipment.zipCode,
        city: shipment.city,
        state: shipment.state,
        status: shipment.status,
        freightPriceInCents: shipment.freightPriceInCents,
        estimatedDeliveryAt: shipment.estimatedDeliveryAt ? shipment.estimatedDeliveryAt.toISOString() : null,
        shippedAt: shipment.shippedAt ? shipment.shippedAt.toISOString() : null,
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : null,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private async generateOrderCode() {
    const prefix = `SPD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    let suffix = 1;
    while (true) {
      const code = `${prefix}-${String(suffix).padStart(4, '0')}`;
      const exists = await this.prisma.order.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!exists) {
        return code;
      }
      suffix += 1;
    }
  }
}

type OrderWithRelations = Order & {
  items: Array<{
    id: string;
    productVariantId: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPriceInCents: number;
    totalPriceInCents: number;
  }>;
  paymentTransactions: Array<{
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    externalReference: string | null;
    amountInCents: number;
    installments: number | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  shipments: Array<{
    id: string;
    carrierId: string | null;
    carrier: string | null;
    carrierName: string | null;
    serviceCode: string | null;
    serviceName: string | null;
    trackingCode: string | null;
    recipient: string | null;
    zipCode: string | null;
    city: string | null;
    state: string | null;
    status: ShipmentStatus;
    freightPriceInCents: number;
    estimatedDeliveryAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  }>;
};
