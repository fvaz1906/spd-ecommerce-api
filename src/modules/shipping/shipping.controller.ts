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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { CreateCarrierAddressRecordDto } from './dtos/create-carrier-address-record.dto';
import { CreateCarrierContactRecordDto } from './dtos/create-carrier-contact-record.dto';
import { CreateCarrierFreightRuleDto } from './dtos/create-carrier-freight-rule.dto';
import { CreateCarrierDto } from './dtos/create-carrier.dto';
import { CarrierFreightSimulationResponseDto } from './dtos/carrier-freight-rule.responses';
import { SimulateCarrierFreightDto } from './dtos/simulate-carrier-freight.dto';
import {
  CarrierDeleteResponseDto,
  CarrierResponseDto,
  CarrierZipCodeLookupResponseDto,
  ShippingOverviewResponseDto,
} from './dtos/shipping.responses';
import { UpdateCarrierItemStatusDto } from './dtos/update-carrier-item-status.dto';
import { UpdateCarrierStatusDto } from './dtos/update-carrier-status.dto';
import { UpdateCarrierDto } from './dtos/update-carrier.dto';
import { ShippingService } from './shipping.service';

@ApiTags('Shipping')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiOperation({ summary: 'Visao geral de transportadoras' })
  @ApiOkResponse({ type: ShippingOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.shippingService.getOverview();
  }

  @ApiOperation({ summary: 'Listar transportadoras cadastradas' })
  @ApiOkResponse({ type: [CarrierResponseDto] })
  @Get('carriers')
  listCarriers() {
    return this.shippingService.listCarriers();
  }

  @ApiOperation({ summary: 'Consultar CEP no ViaCEP' })
  @ApiParam({ name: 'zipCode', description: 'CEP com 8 digitos' })
  @ApiOkResponse({ type: CarrierZipCodeLookupResponseDto })
  @Get('zip-code/:zipCode')
  lookupZipCode(@Param('zipCode') zipCode: string) {
    return this.shippingService.lookupZipCode(zipCode);
  }

  @ApiOperation({ summary: 'Obter detalhes da transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Get('carriers/:id')
  getCarrier(@Param('id') carrierId: string) {
    return this.shippingService.getCarrier(carrierId);
  }

  @ApiOperation({ summary: 'Cadastrar transportadora' })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  @Post('carriers')
  createCarrier(@Body() body: CreateCarrierDto) {
    return this.shippingService.createCarrier(body);
  }

  @ApiOperation({ summary: 'Atualizar transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Patch('carriers/:id')
  updateCarrier(
    @Param('id') carrierId: string,
    @Body() body: UpdateCarrierDto,
  ) {
    return this.shippingService.updateCarrier(carrierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Patch('carriers/:id/status')
  updateCarrierStatus(
    @Param('id') carrierId: string,
    @Body() body: UpdateCarrierStatusDto,
  ) {
    return this.shippingService.updateCarrierStatus(carrierId, body);
  }

  @ApiOperation({ summary: 'Adicionar contato a transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  @Post('carriers/:id/contacts')
  createCarrierContact(
    @Param('id') carrierId: string,
    @Body() body: CreateCarrierContactRecordDto,
  ) {
    return this.shippingService.createCarrierContact(carrierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar contato da transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiParam({ name: 'contactId', description: 'ID do contato' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Patch('carriers/:id/contacts/:contactId/status')
  updateCarrierContactStatus(
    @Param('id') carrierId: string,
    @Param('contactId') contactId: string,
    @Body() body: UpdateCarrierItemStatusDto,
  ) {
    return this.shippingService.updateCarrierContactStatus(
      carrierId,
      contactId,
      body,
    );
  }

  @ApiOperation({ summary: 'Adicionar endereco a transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  @Post('carriers/:id/addresses')
  createCarrierAddress(
    @Param('id') carrierId: string,
    @Body() body: CreateCarrierAddressRecordDto,
  ) {
    return this.shippingService.createCarrierAddress(carrierId, body);
  }

  @ApiOperation({ summary: 'Adicionar regra de frete a transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  @Post('carriers/:id/freight-rules')
  createCarrierFreightRule(
    @Param('id') carrierId: string,
    @Body() body: CreateCarrierFreightRuleDto,
  ) {
    return this.shippingService.createCarrierFreightRule(carrierId, body);
  }

  @ApiOperation({
    summary: 'Ativar ou desativar regra de frete da transportadora',
  })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiParam({ name: 'ruleId', description: 'ID da regra de frete' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Patch('carriers/:id/freight-rules/:ruleId/status')
  updateCarrierFreightRuleStatus(
    @Param('id') carrierId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateCarrierItemStatusDto,
  ) {
    return this.shippingService.updateCarrierFreightRuleStatus(
      carrierId,
      ruleId,
      body,
    );
  }

  @ApiOperation({ summary: 'Simular frete pela tabela da transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiOkResponse({ type: CarrierFreightSimulationResponseDto })
  @Post('carriers/:id/simulate')
  simulateCarrierFreight(
    @Param('id') carrierId: string,
    @Body() body: SimulateCarrierFreightDto,
  ) {
    return this.shippingService.simulateCarrierFreight(carrierId, body);
  }

  @ApiOperation({ summary: 'Ativar ou desativar endereco da transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiParam({ name: 'addressId', description: 'ID do endereco' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @Patch('carriers/:id/addresses/:addressId/status')
  updateCarrierAddressStatus(
    @Param('id') carrierId: string,
    @Param('addressId') addressId: string,
    @Body() body: UpdateCarrierItemStatusDto,
  ) {
    return this.shippingService.updateCarrierAddressStatus(
      carrierId,
      addressId,
      body,
    );
  }

  @ApiOperation({ summary: 'Remover transportadora' })
  @ApiParam({ name: 'id', description: 'ID da transportadora' })
  @ApiOkResponse({ type: CarrierDeleteResponseDto })
  @Delete('carriers/:id')
  deleteCarrier(@Param('id') carrierId: string) {
    return this.shippingService.deleteCarrier(carrierId);
  }
}
