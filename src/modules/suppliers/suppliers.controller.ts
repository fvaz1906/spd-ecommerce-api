import {
  Body,
  Controller,
  Delete,
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
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import {
  SupplierDeleteResponseDto,
  SupplierResponseDto,
  SupplierZipCodeLookupResponseDto,
  SuppliersOverviewResponseDto,
} from './dtos/suppliers.responses';
import { CreateSupplierAddressRecordDto } from './dtos/create-supplier-address-record.dto';
import { CreateSupplierContactRecordDto } from './dtos/create-supplier-contact-record.dto';
import { UpdateSupplierStatusDto } from './dtos/update-supplier-status.dto';
import { UpdateSupplierItemStatusDto } from './dtos/update-supplier-item-status.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @ApiOperation({ summary: 'Visao geral de fornecedores' })
  @ApiOkResponse({ type: SuppliersOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.suppliersService.getOverview();
  }

  @ApiOperation({ summary: 'Listar fornecedores cadastrados' })
  @ApiOkResponse({ type: [SupplierResponseDto] })
  @Get()
  listSuppliers() {
    return this.suppliersService.listSuppliers();
  }

  @ApiOperation({ summary: 'Consultar CEP no Correios' })
  @ApiParam({ name: 'zipCode', description: 'CEP com 8 digitos' })
  @ApiOkResponse({ type: SupplierZipCodeLookupResponseDto })
  @Get('zip-code/:zipCode')
  lookupZipCode(@Param('zipCode') zipCode: string) {
    return this.suppliersService.lookupZipCode(zipCode);
  }

  @ApiOperation({ summary: 'Obter detalhes do fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @Get(':id')
  getSupplier(@Param('id') supplierId: string) {
    return this.suppliersService.getSupplier(supplierId);
  }

  @ApiOperation({ summary: 'Cadastrar fornecedor' })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  @Post()
  createSupplier(@Body() body: CreateSupplierDto) {
    return this.suppliersService.createSupplier(body);
  }

  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @Patch(':id')
  updateSupplier(
    @Param('id') supplierId: string,
    @Body() body: UpdateSupplierDto,
  ) {
    return this.suppliersService.updateSupplier(supplierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @Patch(':id/status')
  updateSupplierStatus(
    @Param('id') supplierId: string,
    @Body() body: UpdateSupplierStatusDto,
  ) {
    return this.suppliersService.updateSupplierStatus(supplierId, body);
  }

  @ApiOperation({ summary: 'Adicionar contato ao fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  @Post(':id/contacts')
  createSupplierContact(
    @Param('id') supplierId: string,
    @Body() body: CreateSupplierContactRecordDto,
  ) {
    return this.suppliersService.createSupplierContact(supplierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar contato do fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiParam({ name: 'contactId', description: 'ID do contato' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @Patch(':id/contacts/:contactId/status')
  updateSupplierContactStatus(
    @Param('id') supplierId: string,
    @Param('contactId') contactId: string,
    @Body() body: UpdateSupplierItemStatusDto,
  ) {
    return this.suppliersService.updateSupplierContactStatus(
      supplierId,
      contactId,
      body,
    );
  }

  @ApiOperation({ summary: 'Adicionar endereco ao fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  @Post(':id/addresses')
  createSupplierAddress(
    @Param('id') supplierId: string,
    @Body() body: CreateSupplierAddressRecordDto,
  ) {
    return this.suppliersService.createSupplierAddress(supplierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar endereco do fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiParam({ name: 'addressId', description: 'ID do endereco' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @Patch(':id/addresses/:addressId/status')
  updateSupplierAddressStatus(
    @Param('id') supplierId: string,
    @Param('addressId') addressId: string,
    @Body() body: UpdateSupplierItemStatusDto,
  ) {
    return this.suppliersService.updateSupplierAddressStatus(
      supplierId,
      addressId,
      body,
    );
  }

  @ApiOperation({ summary: 'Remover fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiOkResponse({ type: SupplierDeleteResponseDto })
  @Delete(':id')
  deleteSupplier(@Param('id') supplierId: string) {
    return this.suppliersService.deleteSupplier(supplierId);
  }
}
