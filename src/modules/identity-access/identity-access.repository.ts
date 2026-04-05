import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';

export type AppUserRole = 'admin' | 'customer' | 'manager';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AppUserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PasswordResetRecord = {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class IdentityAccessRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string): Promise<AppUser | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    return user ? this.mapUser(user) : null;
  }

  async findUserById(id: string): Promise<AppUser | null> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : null;
  }

  async createCustomerAccount(input: {
    name: string;
    email: string;
    passwordHash?: string;
    document: string;
    phone?: string;
    birthDate?: Date;
  }): Promise<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.prismaService.customer.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash ?? null,
        document: input.document,
        phone: input.phone ?? null,
        birthDate: input.birthDate ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async storePasswordResetCode(input: {
    userId: string;
    code: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prismaService.passwordResetCode.create({
      data: input,
    });
  }

  async invalidateActivePasswordResetCodes(userId: string): Promise<void> {
    await this.prismaService.passwordResetCode.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async findValidPasswordResetCode(input: {
    email: string;
    code: string;
  }): Promise<PasswordResetRecord | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return this.prismaService.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        code: input.code,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markPasswordResetCodeAsUsed(id: string): Promise<void> {
    await this.prismaService.passwordResetCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: { toString(): string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AppUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role.toString().toLowerCase() as AppUserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
