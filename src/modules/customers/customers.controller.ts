import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { CustomersService } from './customers.service';
import {
  CustomerResponseDto,
  CustomersOverviewResponseDto,
} from './dtos/customers.responses';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Visao geral de clientes' })
  @ApiOkResponse({ type: CustomersOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.customersService.getOverview();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar clientes cadastrados' })
  @ApiOkResponse({ type: [CustomerResponseDto] })
  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }
}
