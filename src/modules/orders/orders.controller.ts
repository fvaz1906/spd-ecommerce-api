import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { CreateOrderDto } from './dtos/create-order.dto';
import {
  OrderCreationOptionsResponseDto,
  OrderResponseDto,
  OrdersOverviewResponseDto,
} from './dtos/orders.responses';
import { UpdateOrderPaymentDto } from './dtos/update-order-payment.dto';
import { UpdateOrderShipmentDto } from './dtos/update-order-shipment.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Visao geral de pedidos' })
  @ApiOkResponse({ type: OrdersOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.ordersService.getOverview();
  }

  @ApiOperation({ summary: 'Opcoes para criacao de pedidos' })
  @ApiOkResponse({ type: OrderCreationOptionsResponseDto })
  @Get('creation-options')
  getCreationOptions() {
    return this.ordersService.getCreationOptions();
  }

  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiOkResponse({ type: [OrderResponseDto] })
  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @ApiOperation({ summary: 'Obter pedido por id' })
  @ApiOkResponse({ type: OrderResponseDto })
  @Get(':id')
  getOrderById(@Param('id') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @ApiOperation({ summary: 'Cadastrar pedido pelo sistema administrativo' })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @Post()
  createOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @ApiOperation({ summary: 'Atualizar status do pedido' })
  @ApiOkResponse({ type: OrderResponseDto })
  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, body);
  }

  @ApiOperation({ summary: 'Atualizar pagamento do pedido' })
  @ApiOkResponse({ type: OrderResponseDto })
  @Patch(':id/payment')
  updateOrderPayment(
    @Param('id') orderId: string,
    @Body() body: UpdateOrderPaymentDto,
  ) {
    return this.ordersService.updateOrderPayment(orderId, body);
  }

  @ApiOperation({ summary: 'Atualizar expedicao do pedido' })
  @ApiOkResponse({ type: OrderResponseDto })
  @Patch(':id/shipment')
  updateOrderShipment(
    @Param('id') orderId: string,
    @Body() body: UpdateOrderShipmentDto,
  ) {
    return this.ordersService.updateOrderShipment(orderId, body);
  }
}
