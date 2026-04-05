import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { HealthController } from '@/core/http/health.controller';
import { RolesGuard } from '@/core/security/roles.guard';
import { AppThrottlerGuard } from '@/core/security/throttler.guard';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { IdentityAccessModule } from '@/modules/identity-access/identity-access.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { CartModule } from '@/modules/cart/cart.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { PricingModule } from '@/modules/pricing/pricing.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config) => {
        const isProduction = config.NODE_ENV === 'production';

        if (isProduction) {
          if (!config.DATABASE_URL) {
            throw new Error('DATABASE_URL must be configured in production.');
          }

          if (
            !config.JWT_SECRET ||
            config.JWT_SECRET === 'change-me' ||
            config.JWT_SECRET.length < 32
          ) {
            throw new Error(
              'JWT_SECRET must be configured with a strong value in production.',
            );
          }

          if (!config.CORS_ORIGINS?.trim()) {
            throw new Error(
              'CORS_ORIGINS must be configured in production.',
            );
          }

          if (
            config.API_DOCS_ENABLED === 'true' &&
            config.ALLOW_PUBLIC_API_DOCS !== 'true'
          ) {
            throw new Error(
              'Set ALLOW_PUBLIC_API_DOCS=true to expose API docs in production.',
            );
          }

          if (
            !config.MAIL_HOST ||
            !config.MAIL_USER ||
            !config.MAIL_PASS
          ) {
            throw new Error(
              'MAIL_HOST, MAIL_USER and MAIL_PASS must be configured in production.',
            );
          }
        }

        return config;
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    CatalogModule,
    IdentityAccessModule,
    CustomersModule,
    CartModule,
    OrdersModule,
    InventoryModule,
    SuppliersModule,
    PricingModule,
    ShippingModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
  providers: [
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
