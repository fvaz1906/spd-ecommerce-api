import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { HealthController } from '@/core/http/health.controller';
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
    }),
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
})
export class AppModule {}
