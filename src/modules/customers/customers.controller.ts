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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/core/security/roles.decorator';
import { RolesGuard } from '@/core/security/roles.guard';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerAddressDto } from './dtos/create-customer-address.dto';
import { CreateCustomerContactDto } from './dtos/create-customer-contact.dto';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import {
  CustomerResponseDto,
  CustomersOverviewResponseDto,
  CustomerZipCodeLookupResponseDto,
} from './dtos/customers.responses';
import { SetCustomerPrimaryRecordDto } from './dtos/set-customer-primary-record.dto';
import { UpdateCustomerStatusDto } from './dtos/update-customer-status.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { UpdateCustomerRecordStatusDto } from './dtos/update-customer-record-status.dto';

@ApiTags('Customers')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Visao geral de clientes' })
  @ApiOkResponse({ type: CustomersOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.customersService.getOverview();
  }

  @ApiOperation({ summary: 'Consultar CEP no ViaCEP' })
  @ApiParam({ name: 'zipCode', description: 'CEP com 8 digitos' })
  @ApiOkResponse({ type: CustomerZipCodeLookupResponseDto })
  @Get('zip-code/:zipCode')
  lookupZipCode(@Param('zipCode') zipCode: string) {
    return this.customersService.lookupZipCode(zipCode);
  }

  @ApiOperation({ summary: 'Listar clientes cadastrados' })
  @ApiOkResponse({ type: [CustomerResponseDto] })
  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }

  @ApiOperation({ summary: 'Obter um cliente por id' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Get(':id')
  getCustomerById(@Param('id') id: string) {
    return this.customersService.getCustomerById(id);
  }

  @ApiOperation({ summary: 'Cadastrar cliente pelo sistema administrativo' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  @Post()
  createCustomer(@Body() body: CreateCustomerDto) {
    return this.customersService.createCustomer(body);
  }

  @ApiOperation({ summary: 'Atualizar dados principais do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id')
  updateCustomer(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customersService.updateCustomer(id, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id/status')
  updateCustomerStatus(
    @Param('id') id: string,
    @Body() body: UpdateCustomerStatusDto,
  ) {
    return this.customersService.updateCustomerStatus(id, body.isActive);
  }

  @ApiOperation({ summary: 'Cadastrar contato do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Post(':id/contacts')
  createCustomerContact(
    @Param('id') customerId: string,
    @Body() body: CreateCustomerContactDto,
  ) {
    return this.customersService.createCustomerContact(customerId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar contato do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id/contacts/:contactId/status')
  updateCustomerContactStatus(
    @Param('id') customerId: string,
    @Param('contactId') contactId: string,
    @Body() body: UpdateCustomerRecordStatusDto,
  ) {
    return this.customersService.updateCustomerContactStatus(
      customerId,
      contactId,
      body.isActive,
    );
  }

  @ApiOperation({ summary: 'Definir contato principal do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id/contacts/:contactId/primary')
  setPrimaryCustomerContact(
    @Param('id') customerId: string,
    @Param('contactId') contactId: string,
    @Body() body: SetCustomerPrimaryRecordDto,
  ) {
    return this.customersService.setPrimaryCustomerContact(
      customerId,
      contactId,
      body.isPrimary,
    );
  }

  @ApiOperation({ summary: 'Cadastrar endereco do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Post(':id/addresses')
  createCustomerAddress(
    @Param('id') customerId: string,
    @Body() body: CreateCustomerAddressDto,
  ) {
    return this.customersService.createCustomerAddress(customerId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar endereco do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id/addresses/:addressId/status')
  updateCustomerAddressStatus(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Body() body: UpdateCustomerRecordStatusDto,
  ) {
    return this.customersService.updateCustomerAddressStatus(
      customerId,
      addressId,
      body.isActive,
    );
  }

  @ApiOperation({ summary: 'Definir endereco padrao do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Patch(':id/addresses/:addressId/primary')
  setPrimaryCustomerAddress(
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Body() body: SetCustomerPrimaryRecordDto,
  ) {
    return this.customersService.setPrimaryCustomerAddress(
      customerId,
      addressId,
      body.isPrimary,
    );
  }
}
