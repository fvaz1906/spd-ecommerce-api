import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Carrier } from '@prisma/client';
import { lookupViaCep } from '@/core/http/viacep.client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateCarrierAddressRecordDto } from './dtos/create-carrier-address-record.dto';
import { CreateCarrierContactRecordDto } from './dtos/create-carrier-contact-record.dto';
import { CreateCarrierFreightRuleDto } from './dtos/create-carrier-freight-rule.dto';
import { CreateCarrierDto } from './dtos/create-carrier.dto';
import { SimulateCarrierFreightDto } from './dtos/simulate-carrier-freight.dto';
import { UpdateCarrierItemStatusDto } from './dtos/update-carrier-item-status.dto';
import { UpdateCarrierStatusDto } from './dtos/update-carrier-status.dto';
import { UpdateCarrierDto } from './dtos/update-carrier.dto';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const carriers = await this.prisma.carrier.findMany({
      select: { status: true },
    });

    return {
      context: 'shipping',
      features: ['carriers', 'contacts', 'addresses', 'freight'],
      endpoints: [
        'GET /api/shipping/overview',
        'GET /api/shipping/carriers',
        'GET /api/shipping/zip-code/:zipCode',
        'GET /api/shipping/carriers/:id',
        'POST /api/shipping/carriers',
        'PATCH /api/shipping/carriers/:id',
        'PATCH /api/shipping/carriers/:id/status',
        'POST /api/shipping/carriers/:id/contacts',
        'PATCH /api/shipping/carriers/:id/contacts/:contactId/status',
        'POST /api/shipping/carriers/:id/addresses',
        'PATCH /api/shipping/carriers/:id/addresses/:addressId/status',
        'POST /api/shipping/carriers/:id/freight-rules',
        'PATCH /api/shipping/carriers/:id/freight-rules/:ruleId/status',
        'POST /api/shipping/carriers/:id/simulate',
        'DELETE /api/shipping/carriers/:id',
      ],
      totalCarriers: carriers.length,
      activeCarriers: carriers.filter((carrier) => carrier.status === 'ACTIVE')
        .length,
      inactiveCarriers: carriers.filter(
        (carrier) => carrier.status === 'INACTIVE',
      ).length,
    };
  }

  async listCarriers() {
    const carriers = await this.prisma.carrier.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.carrierInclude,
    });

    return carriers.map((carrier) => this.toCarrierResponse(carrier));
  }

  async getCarrier(carrierId: string) {
    const carrier = await this.findCarrierOrFail(carrierId);
    return this.toCarrierResponse(carrier);
  }

  async lookupZipCode(zipCode: string) {
    const normalizedZipCode = this.normalizeZipCode(zipCode);

    if (normalizedZipCode.length !== 8) {
      throw new BadRequestException('Informe um CEP valido com 8 digitos.');
    }

    return lookupViaCep(normalizedZipCode);
  }

  async createCarrier(input: CreateCarrierDto) {
    await this.ensureDocumentAvailable(input.document);

    const carrier = await this.prisma.carrier.create({
      data: {
        name: input.name.trim(),
        tradeName: input.tradeName?.trim() || null,
        document: this.normalizeDocument(input.document),
        openedAt: input.openedAt ? new Date(input.openedAt) : null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        averageFreightCostInCents: input.averageFreightCostInCents,
        notes: input.notes?.trim() || null,
        status: 'ACTIVE',
      },
      include: this.carrierInclude,
    });

    return this.toCarrierResponse(carrier);
  }

  async updateCarrier(carrierId: string, input: UpdateCarrierDto) {
    await this.findCarrierOrFail(carrierId);

    if (input.document) {
      await this.ensureDocumentAvailable(input.document, carrierId);
    }

    const carrier = await this.prisma.carrier.update({
      where: { id: carrierId },
      data: {
        name: input.name?.trim(),
        tradeName:
          input.tradeName !== undefined
            ? input.tradeName.trim() || null
            : undefined,
        document: input.document
          ? this.normalizeDocument(input.document)
          : undefined,
        openedAt:
          input.openedAt !== undefined
            ? input.openedAt
              ? new Date(input.openedAt)
              : null
            : undefined,
        email:
          input.email !== undefined
            ? input.email.trim().toLowerCase() || null
            : undefined,
        phone:
          input.phone !== undefined ? input.phone.trim() || null : undefined,
        averageFreightCostInCents:
          input.averageFreightCostInCents !== undefined
            ? input.averageFreightCostInCents
            : undefined,
        notes:
          input.notes !== undefined ? input.notes.trim() || null : undefined,
      },
      include: this.carrierInclude,
    });

    return this.toCarrierResponse(carrier);
  }

  async updateCarrierStatus(carrierId: string, input: UpdateCarrierStatusDto) {
    await this.findCarrierOrFail(carrierId);

    const carrier = await this.prisma.carrier.update({
      where: { id: carrierId },
      data: { status: input.status },
      include: this.carrierInclude,
    });

    return this.toCarrierResponse(carrier);
  }

  async createCarrierContact(
    carrierId: string,
    input: CreateCarrierContactRecordDto,
  ) {
    await this.findCarrierOrFail(carrierId);

    await this.prisma.carrierContact.create({
      data: {
        carrierId,
        name: input.name.trim(),
        role: input.role?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        isActive: true,
      },
    });

    const carrier = await this.findCarrierOrFail(carrierId);
    await this.syncPrimaryContactName(carrierId, carrier);
    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async updateCarrierContactStatus(
    carrierId: string,
    contactId: string,
    input: UpdateCarrierItemStatusDto,
  ) {
    await this.findCarrierOrFail(carrierId);

    const contact = await this.prisma.carrierContact.findFirst({
      where: { id: contactId, carrierId },
    });

    if (!contact) {
      throw new NotFoundException('Contato nao encontrado.');
    }

    await this.prisma.carrierContact.update({
      where: { id: contactId },
      data: { isActive: input.isActive },
    });

    const carrier = await this.findCarrierOrFail(carrierId);
    await this.syncPrimaryContactName(carrierId, carrier);
    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async createCarrierAddress(
    carrierId: string,
    input: CreateCarrierAddressRecordDto,
  ) {
    await this.findCarrierOrFail(carrierId);

    await this.prisma.carrierAddress.create({
      data: {
        carrierId,
        label: this.buildAddressLabel(input.street, input.number),
        zipCode: this.normalizeZipCode(input.zipCode),
        street: input.street.trim(),
        number: input.number.trim(),
        complement: input.complement?.trim() || null,
        neighborhood: input.neighborhood.trim(),
        city: input.city.trim(),
        state: input.state.trim().toUpperCase(),
        country: input.country?.trim().toUpperCase() || 'BR',
        isActive: true,
      },
    });

    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async createCarrierFreightRule(
    carrierId: string,
    input: CreateCarrierFreightRuleDto,
  ) {
    await this.findCarrierOrFail(carrierId);
    this.validateFreightRule(input);

    await this.prisma.carrierFreightRule.create({
      data: {
        carrierId,
        name: input.name.trim(),
        serviceCode: input.serviceCode?.trim() || null,
        minWeightGrams: input.minWeightGrams,
        maxWeightGrams: input.maxWeightGrams,
        minLengthCm: input.minLengthCm,
        maxLengthCm: input.maxLengthCm,
        minWidthCm: input.minWidthCm,
        maxWidthCm: input.maxWidthCm,
        minHeightCm: input.minHeightCm,
        maxHeightCm: input.maxHeightCm,
        baseFreightCostInCents: input.baseFreightCostInCents,
        additionalCostPerKgInCents: input.additionalCostPerKgInCents ?? 0,
        deliveryDays: input.deliveryDays ?? null,
        isActive: true,
      },
    });

    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async updateCarrierAddressStatus(
    carrierId: string,
    addressId: string,
    input: UpdateCarrierItemStatusDto,
  ) {
    await this.findCarrierOrFail(carrierId);

    const address = await this.prisma.carrierAddress.findFirst({
      where: { id: addressId, carrierId },
    });

    if (!address) {
      throw new NotFoundException('Endereco nao encontrado.');
    }

    await this.prisma.carrierAddress.update({
      where: { id: addressId },
      data: { isActive: input.isActive },
    });

    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async updateCarrierFreightRuleStatus(
    carrierId: string,
    ruleId: string,
    input: UpdateCarrierItemStatusDto,
  ) {
    await this.findCarrierOrFail(carrierId);

    const rule = await this.prisma.carrierFreightRule.findFirst({
      where: { id: ruleId, carrierId },
    });

    if (!rule) {
      throw new NotFoundException('Regra de frete nao encontrada.');
    }

    await this.prisma.carrierFreightRule.update({
      where: { id: ruleId },
      data: { isActive: input.isActive },
    });

    return this.toCarrierResponse(await this.findCarrierOrFail(carrierId));
  }

  async simulateCarrierFreight(
    carrierId: string,
    input: SimulateCarrierFreightDto,
  ) {
    const carrier = await this.findCarrierOrFail(carrierId);
    const matchingRule = carrier.freightRules.find((rule) =>
      this.matchesFreightRule(rule, input),
    );

    if (!matchingRule) {
      throw new BadRequestException(
        'Nenhuma regra de frete ativa atende peso e dimensoes informados.',
      );
    }

    const extraWeightGrams = Math.max(
      0,
      input.weightGrams - matchingRule.minWeightGrams,
    );
    const extraWeightKg = Math.ceil(extraWeightGrams / 1000);
    const freightCostInCents =
      matchingRule.baseFreightCostInCents +
      extraWeightKg * matchingRule.additionalCostPerKgInCents;

    return {
      ruleId: matchingRule.id,
      ruleName: matchingRule.name,
      freightCostInCents,
      weightGrams: input.weightGrams,
      billableWeightGrams: Math.max(
        input.weightGrams,
        matchingRule.minWeightGrams,
      ),
      deliveryDays: matchingRule.deliveryDays,
    };
  }

  async deleteCarrier(carrierId: string) {
    await this.findCarrierOrFail(carrierId);

    await this.prisma.carrier.delete({
      where: { id: carrierId },
    });

    return { message: 'Transportadora removida com sucesso.' };
  }

  private get carrierInclude() {
    return {
      contacts: { orderBy: { createdAt: 'asc' as const } },
      addresses: { orderBy: { createdAt: 'asc' as const } },
      freightRules: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private async findCarrierOrFail(carrierId: string) {
    const carrier = await this.prisma.carrier.findUnique({
      where: { id: carrierId },
      include: this.carrierInclude,
    });

    if (!carrier) {
      throw new NotFoundException('Transportadora nao encontrada.');
    }

    return carrier;
  }

  private async syncPrimaryContactName(
    carrierId: string,
    carrier: CarrierWithRelations,
  ) {
    const activeContact = carrier.contacts.find((contact) => contact.isActive);
    await this.prisma.carrier.update({
      where: { id: carrierId },
      data: { contactName: activeContact?.name || null },
    });
  }

  private async ensureDocumentAvailable(
    document: string,
    excludeCarrierId?: string,
  ) {
    const normalizedDocument = this.normalizeDocument(document);
    const carrier = await this.prisma.carrier.findUnique({
      where: { document: normalizedDocument },
    });

    if (carrier && carrier.id !== excludeCarrierId) {
      throw new BadRequestException(
        'Ja existe uma transportadora com esse documento.',
      );
    }
  }

  private normalizeDocument(document: string) {
    return document.replace(/\D/g, '');
  }

  private normalizeZipCode(zipCode: string) {
    return zipCode.replace(/\D/g, '');
  }

  private buildAddressLabel(street: string, number: string) {
    return `${street.trim()}, ${number.trim()}`;
  }

  private validateFreightRule(input: CreateCarrierFreightRuleDto) {
    if (input.maxWeightGrams < input.minWeightGrams) {
      throw new BadRequestException(
        'Peso maximo deve ser maior ou igual ao peso minimo.',
      );
    }

    if (input.maxLengthCm < input.minLengthCm) {
      throw new BadRequestException(
        'Comprimento maximo deve ser maior ou igual ao minimo.',
      );
    }

    if (input.maxWidthCm < input.minWidthCm) {
      throw new BadRequestException(
        'Largura maxima deve ser maior ou igual a minima.',
      );
    }

    if (input.maxHeightCm < input.minHeightCm) {
      throw new BadRequestException(
        'Altura maxima deve ser maior ou igual a minima.',
      );
    }
  }

  private matchesFreightRule(
    rule: CarrierWithRelations['freightRules'][number],
    payload: SimulateCarrierFreightDto,
  ) {
    return (
      rule.isActive &&
      payload.weightGrams >= rule.minWeightGrams &&
      payload.weightGrams <= rule.maxWeightGrams &&
      payload.lengthCm >= rule.minLengthCm &&
      payload.lengthCm <= rule.maxLengthCm &&
      payload.widthCm >= rule.minWidthCm &&
      payload.widthCm <= rule.maxWidthCm &&
      payload.heightCm >= rule.minHeightCm &&
      payload.heightCm <= rule.maxHeightCm
    );
  }

  private toCarrierResponse(carrier: CarrierWithRelations) {
    return {
      id: carrier.id,
      name: carrier.name,
      tradeName: carrier.tradeName,
      document: carrier.document,
      openedAt: carrier.openedAt ? carrier.openedAt.toISOString() : null,
      email: carrier.email,
      phone: carrier.phone,
      contactName: carrier.contactName,
      averageFreightCostInCents: carrier.averageFreightCostInCents,
      freightRules: carrier.freightRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        serviceCode: rule.serviceCode,
        minWeightGrams: rule.minWeightGrams,
        maxWeightGrams: rule.maxWeightGrams,
        minLengthCm: rule.minLengthCm,
        maxLengthCm: rule.maxLengthCm,
        minWidthCm: rule.minWidthCm,
        maxWidthCm: rule.maxWidthCm,
        minHeightCm: rule.minHeightCm,
        maxHeightCm: rule.maxHeightCm,
        baseFreightCostInCents: rule.baseFreightCostInCents,
        additionalCostPerKgInCents: rule.additionalCostPerKgInCents,
        deliveryDays: rule.deliveryDays,
        isActive: rule.isActive,
      })),
      contacts: carrier.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isActive: contact.isActive,
      })),
      addresses: carrier.addresses.map((address) => ({
        id: address.id,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: address.country,
        isActive: address.isActive,
      })),
      notes: carrier.notes,
      status: carrier.status,
      createdAt: carrier.createdAt.toISOString(),
    };
  }
}

type CarrierWithRelations = Carrier & {
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
  }>;
  freightRules: Array<{
    id: string;
    name: string;
    serviceCode: string | null;
    minWeightGrams: number;
    maxWeightGrams: number;
    minLengthCm: number;
    maxLengthCm: number;
    minWidthCm: number;
    maxWidthCm: number;
    minHeightCm: number;
    maxHeightCm: number;
    baseFreightCostInCents: number;
    additionalCostPerKgInCents: number;
    deliveryDays: number | null;
    isActive: boolean;
  }>;
  addresses: Array<{
    id: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    isActive: boolean;
  }>;
};
