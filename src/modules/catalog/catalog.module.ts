import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { R2StorageService } from './r2-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [CatalogController],
  providers: [CatalogService, R2StorageService],
})
export class CatalogModule {}
