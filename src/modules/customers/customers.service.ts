import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const customers = await this.prisma.customer.findMany({
      include: {
        user: {
          select: {
            isActive: true,
          },
        },
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      context: 'customers',
      features: ['profile', 'addresses', 'history'],
      endpoints: ['GET /api/customers/overview', 'GET /api/customers'],
      totalCustomers: customers.length,
      activeCustomers: customers.filter((customer) => customer.user.isActive)
        .length,
      withOrders: customers.filter((customer) => customer.orders.length > 0)
        .length,
    };
  }

  async listCustomers() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true,
          },
        },
        addresses: {
          select: {
            id: true,
          },
        },
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      document: customer.document ?? null,
      phone: customer.phone ?? null,
      isActive: customer.user.isActive,
      addressesCount: customer.addresses.length,
      ordersCount: customer.orders.length,
      createdAt: customer.createdAt.toISOString(),
    }));
  }
}
