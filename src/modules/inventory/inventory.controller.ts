import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { CreateStockMovementDto } from './dtos/create-stock-movement.dto';
import {
  InventoryItemResponseDto,
  InventoryOverviewResponseDto,
  StockMovementResponseDto,
} from './dtos/inventory.responses';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Visao geral de estoque' })
  @ApiOkResponse({ type: InventoryOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.inventoryService.getOverview();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar itens de estoque vinculados aos produtos' })
  @ApiOkResponse({ type: [InventoryItemResponseDto] })
  @Get('items')
  listItems() {
    return this.inventoryService.listItems();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar ultimas movimentacoes de estoque' })
  @ApiOkResponse({ type: [StockMovementResponseDto] })
  @Get('movements')
  listMovements() {
    return this.inventoryService.listMovements();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Criar movimentacao de estoque' })
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  @Post('movements')
  createMovement(@Body() body: CreateStockMovementDto) {
    return this.inventoryService.createMovement(body);
  }
}
