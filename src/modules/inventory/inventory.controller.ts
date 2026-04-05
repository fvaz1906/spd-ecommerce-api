import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/core/security/roles.decorator';
import { RolesGuard } from '@/core/security/roles.guard';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { CreateStockMovementDto } from './dtos/create-stock-movement.dto';
import {
  InventoryItemResponseDto,
  InventoryOverviewResponseDto,
  StockMovementResponseDto,
} from './dtos/inventory.responses';

@ApiTags('Inventory')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Visao geral de estoque' })
  @ApiOkResponse({ type: InventoryOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.inventoryService.getOverview();
  }

  @ApiOperation({ summary: 'Listar itens de estoque vinculados aos produtos' })
  @ApiOkResponse({ type: [InventoryItemResponseDto] })
  @Get('items')
  listItems() {
    return this.inventoryService.listItems();
  }

  @ApiOperation({ summary: 'Listar ultimas movimentacoes de estoque' })
  @ApiOkResponse({ type: [StockMovementResponseDto] })
  @Get('movements')
  listMovements() {
    return this.inventoryService.listMovements();
  }

  @ApiOperation({ summary: 'Criar movimentacao de estoque' })
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  @Post('movements')
  createMovement(@Body() body: CreateStockMovementDto) {
    return this.inventoryService.createMovement(body);
  }
}
