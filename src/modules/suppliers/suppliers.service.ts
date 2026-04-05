import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { lookupViaCep } from '@/core/http/viacep.client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateSupplierAddressRecordDto } from './dtos/create-supplier-address-record.dto';
import { CreateSupplierContactRecordDto } from './dtos/create-supplier-contact-record.dto';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierItemStatusDto } from './dtos/update-supplier-item-status.dto';
import { UpdateSupplierStatusDto } from './dtos/update-supplier-status.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const suppliers = await this.prisma.supplier.findMany({
      select: { status: true },
    });

    return {
      context: 'suppliers',
      features: ['directory', 'contacts', 'addresses', 'status'],
      endpoints: [
        'GET /api/suppliers/overview',
        'GET /api/suppliers',
        'GET /api/suppliers/zip-code/:zipCode',
        'GET /api/suppliers/:id',
        'POST /api/suppliers',
        'PATCH /api/suppliers/:id',
        'PATCH /api/suppliers/:id/status',
        'POST /api/suppliers/:id/contacts',
        'PATCH /api/suppliers/:id/contacts/:contactId/status',
        'POST /api/suppliers/:id/addresses',
        'PATCH /api/suppliers/:id/addresses/:addressId/status',
        'DELETE /api/suppliers/:id',
      ],
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(
        (supplier) => supplier.status === 'ACTIVE',
      ).length,
      inactiveSuppliers: suppliers.filter(
        (supplier) => supplier.status === 'INACTIVE',
      ).length,
    };
  }

  async listSuppliers() {
    const suppliers = await this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.supplierInclude,
    });

    return suppliers.map((supplier) => this.toSupplierResponse(supplier));
  }

  async getSupplier(supplierId: string) {
    const supplier = await this.findSupplierOrFail(supplierId);
    return this.toSupplierResponse(supplier);
  }

  async lookupZipCode(zipCode: string) {
    const normalizedZipCode = this.normalizeZipCode(zipCode);

    if (normalizedZipCode.length !== 8) {
      throw new BadRequestException('Informe um CEP valido com 8 digitos.');
    }

    return lookupViaCep(normalizedZipCode);
  }

  async createSupplier(input: CreateSupplierDto) {
    await this.ensureDocumentAvailable(input.document);

    const supplier = await this.prisma.supplier.create({
      data: {
        name: input.name.trim(),
        tradeName: input.tradeName?.trim() || null,
        document: this.normalizeDocument(input.document),
        openedAt: input.openedAt ? new Date(input.openedAt) : null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        contactName: input.contactName?.trim() || null,
        notes: input.notes?.trim() || null,
        status: 'ACTIVE',
      },
      include: this.supplierInclude,
    });

    return this.toSupplierResponse(supplier);
  }

  async updateSupplier(supplierId: string, input: UpdateSupplierDto) {
    await this.findSupplierOrFail(supplierId);

    if (input.document) {
      await this.ensureDocumentAvailable(input.document, supplierId);
    }

    const supplier = await this.prisma.supplier.update({
      where: { id: supplierId },
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
        contactName:
          input.contactName !== undefined
            ? input.contactName.trim() || null
            : undefined,
        notes:
          input.notes !== undefined ? input.notes.trim() || null : undefined,
      },
      include: this.supplierInclude,
    });

    return this.toSupplierResponse(supplier);
  }

  async updateSupplierStatus(
    supplierId: string,
    input: UpdateSupplierStatusDto,
  ) {
    await this.findSupplierOrFail(supplierId);

    const updatedSupplier = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { status: input.status },
      include: this.supplierInclude,
    });

    return this.toSupplierResponse(updatedSupplier);
  }

  async createSupplierContact(
    supplierId: string,
    input: CreateSupplierContactRecordDto,
  ) {
    await this.findSupplierOrFail(supplierId);

    await this.prisma.supplierContact.create({
      data: {
        supplierId,
        name: input.name.trim(),
        role: input.role?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        isActive: true,
      },
    });

    const supplier = await this.findSupplierOrFail(supplierId);
    await this.syncPrimaryContactName(supplierId, supplier);
    return this.toSupplierResponse(await this.findSupplierOrFail(supplierId));
  }

  async updateSupplierContactStatus(
    supplierId: string,
    contactId: string,
    input: UpdateSupplierItemStatusDto,
  ) {
    await this.findSupplierOrFail(supplierId);

    const contact = await this.prisma.supplierContact.findFirst({
      where: {
        id: contactId,
        supplierId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contato nao encontrado.');
    }

    await this.prisma.supplierContact.update({
      where: { id: contactId },
      data: { isActive: input.isActive },
    });

    const supplier = await this.findSupplierOrFail(supplierId);
    await this.syncPrimaryContactName(supplierId, supplier);
    return this.toSupplierResponse(await this.findSupplierOrFail(supplierId));
  }

  async createSupplierAddress(
    supplierId: string,
    input: CreateSupplierAddressRecordDto,
  ) {
    await this.findSupplierOrFail(supplierId);

    await this.prisma.supplierAddress.create({
      data: {
        supplierId,
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

    return this.toSupplierResponse(await this.findSupplierOrFail(supplierId));
  }

  async updateSupplierAddressStatus(
    supplierId: string,
    addressId: string,
    input: UpdateSupplierItemStatusDto,
  ) {
    await this.findSupplierOrFail(supplierId);

    const address = await this.prisma.supplierAddress.findFirst({
      where: {
        id: addressId,
        supplierId,
      },
    });

    if (!address) {
      throw new NotFoundException('Endereco nao encontrado.');
    }

    await this.prisma.supplierAddress.update({
      where: { id: addressId },
      data: { isActive: input.isActive },
    });

    return this.toSupplierResponse(await this.findSupplierOrFail(supplierId));
  }

  async deleteSupplier(supplierId: string) {
    await this.findSupplierOrFail(supplierId);

    await this.prisma.supplier.delete({
      where: { id: supplierId },
    });

    return { message: 'Fornecedor removido com sucesso.' };
  }

  private get supplierInclude() {
    return {
      contacts: { orderBy: { createdAt: 'asc' as const } },
      addresses: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private async findSupplierOrFail(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: this.supplierInclude,
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor nao encontrado.');
    }

    return supplier;
  }

  private async syncPrimaryContactName(
    supplierId: string,
    supplier: SupplierWithRelations,
  ) {
    const activeContact = supplier.contacts.find((contact) => contact.isActive);
    await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { contactName: activeContact?.name || null },
    });
  }

  private async ensureDocumentAvailable(
    document: string,
    excludeSupplierId?: string,
  ) {
    const normalizedDocument = this.normalizeDocument(document);
    const supplier = await this.prisma.supplier.findUnique({
      where: { document: normalizedDocument },
    });

    if (supplier && supplier.id !== excludeSupplierId) {
      throw new BadRequestException(
        'Ja existe um fornecedor com esse documento.',
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
    const normalizedStreet = street.trim();
    const normalizedNumber = number.trim();
    return `${normalizedStreet}, ${normalizedNumber}`;
  }

  private toSupplierResponse(supplier: SupplierWithRelations) {
    return {
      id: supplier.id,
      name: supplier.name,
      tradeName: supplier.tradeName,
      document: supplier.document,
      openedAt: supplier.openedAt ? supplier.openedAt.toISOString() : null,
      email: supplier.email,
      phone: supplier.phone,
      contactName: supplier.contactName,
      contacts: supplier.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isActive: contact.isActive,
      })),
      addresses: supplier.addresses.map((address) => ({
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
      notes: supplier.notes,
      status: supplier.status,
      createdAt: supplier.createdAt.toISOString(),
    };
  }
}

type SupplierWithRelations = Supplier & {
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
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
