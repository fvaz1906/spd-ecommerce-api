import { Injectable } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  async checkHealth(): Promise<'up' | 'down'> {
    try {
      await this.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  static toRole(role: 'admin' | 'customer' | 'manager'): UserRole {
    switch (role) {
      case 'admin':
        return UserRole.ADMIN;
      case 'manager':
        return UserRole.MANAGER;
      default:
        return UserRole.CUSTOMER;
    }
  }
}
