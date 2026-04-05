import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { lookupViaCep } from '@/core/http/viacep.client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateCustomerAddressDto } from './dtos/create-customer-address.dto';
import { CreateCustomerContactDto } from './dtos/create-customer-contact.dto';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getOverview() {
    const customers = await this.prisma.customer.findMany({
      select: {
        isActive: true,
        orders: { select: { id: true } },
      },
    });

    return {
      context: 'customers',
      features: [
        'overview',
        'list',
        'details',
        'create',
        'update',
        'contacts',
        'addresses',
        'zip-code-lookup',
      ],
      endpoints: [
        'GET /api/customers/overview',
        'GET /api/customers',
        'GET /api/customers/:id',
        'POST /api/customers',
        'PATCH /api/customers/:id',
        'PATCH /api/customers/:id/status',
        'GET /api/customers/zip-code/:zipCode',
        'POST /api/customers/:id/contacts',
        'PATCH /api/customers/:id/contacts/:contactId/status',
        'PATCH /api/customers/:id/contacts/:contactId/primary',
        'POST /api/customers/:id/addresses',
        'PATCH /api/customers/:id/addresses/:addressId/status',
        'PATCH /api/customers/:id/addresses/:addressId/primary',
      ],
      totalCustomers: customers.length,
      activeCustomers: customers.filter((customer) => customer.isActive).length,
      withOrders: customers.filter((customer) => customer.orders.length > 0)
        .length,
    };
  }

  async listCustomers() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.customerIncludes() as any,
    });

    return customers.map((customer) => this.mapCustomer(customer as any));
  }

  async getCustomerById(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: this.customerIncludes() as any,
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return this.mapCustomer(customer as any);
  }

  async lookupZipCode(zipCode: string) {
    const normalizedZipCode = this.normalizeZipCode(zipCode);

    if (normalizedZipCode.length !== 8) {
      throw new BadRequestException('Informe um CEP valido com 8 digitos.');
    }

    return lookupViaCep(normalizedZipCode);
  }

  async createCustomer(input: CreateCustomerDto) {
    const email = input.email.toLowerCase().trim();
    const document = input.document.trim();
    const googleId = input.googleId?.trim() || null;

    await this.ensureCustomerUniqueness({ email, document, googleId });

    const customer = await this.prisma.customer.create({
      data: {
        name: input.name.trim(),
        email,
        googleId,
        passwordHash: input.password
          ? await hash(input.password, this.getBcryptSaltRounds())
          : null,
        isActive: input.isActive ?? true,
        documentType: input.documentType,
        document,
        phone: input.phone?.trim() || null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
      } as any,
      include: this.customerIncludes() as any,
    });

    return this.mapCustomer(customer as any);
  }

  async updateCustomer(customerId: string, input: UpdateCustomerDto) {
    const customer = (await this.prisma.customer.findUnique({
      where: { id: customerId },
    })) as any;

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    const email = input.email?.toLowerCase().trim() ?? customer.email;
    const document = input.document?.trim() ?? customer.document;
    const googleId =
      input.googleId === undefined ? customer.googleId : input.googleId.trim() || null;

    await this.ensureCustomerUniqueness({
      email,
      document,
      googleId,
      ignoreCustomerId: customerId,
    });

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        name: input.name?.trim() ?? customer.name,
        email,
        googleId,
        isActive: input.isActive ?? customer.isActive,
        documentType: input.documentType ?? customer.documentType,
        document,
        phone:
          input.phone === undefined ? customer.phone : input.phone.trim() || null,
        birthDate:
          input.birthDate === undefined
            ? customer.birthDate
            : input.birthDate
              ? new Date(input.birthDate)
              : null,
        passwordHash: input.password
          ? await hash(input.password, this.getBcryptSaltRounds())
          : customer.passwordHash,
      } as any,
      include: this.customerIncludes() as any,
    });

    return this.mapCustomer(updatedCustomer as any);
  }

  async updateCustomerStatus(customerId: string, isActive: boolean) {
    await this.ensureCustomerExists(customerId);

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: { isActive },
      include: this.customerIncludes() as any,
    });

    return this.mapCustomer(updatedCustomer as any);
  }

  async createCustomerContact(
    customerId: string,
    input: CreateCustomerContactDto,
  ) {
    await this.ensureCustomerExists(customerId);

    await (this.prisma as any).customerContact.create({
      data: {
        customerId,
        name: input.name.trim(),
        role: input.role?.trim() || null,
        email: input.email?.toLowerCase().trim() || null,
        phone: input.phone?.trim() || null,
      },
    });

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryContact(customerId, customer.contacts as any);

    return this.getCustomerById(customerId);
  }

  async updateCustomerContactStatus(
    customerId: string,
    contactId: string,
    isActive: boolean,
  ) {
    const contact = await (this.prisma as any).customerContact.findFirst({
      where: { id: contactId, customerId },
    }) as any;

    if (!contact) {
      throw new NotFoundException('Contato nao encontrado.');
    }

    await (this.prisma as any).customerContact.update({
      where: { id: contactId },
      data: {
        isActive,
        isPrimary: isActive ? contact.isPrimary : false,
      },
    });

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryContact(customerId, customer.contacts as any);

    return this.getCustomerById(customerId);
  }

  async setPrimaryCustomerContact(
    customerId: string,
    contactId: string,
    isPrimary: boolean,
  ) {
    const contact = await (this.prisma as any).customerContact.findFirst({
      where: { id: contactId, customerId },
    }) as any;

    if (!contact) {
      throw new NotFoundException('Contato nao encontrado.');
    }

    if (!contact.isActive) {
      throw new BadRequestException(
        'Apenas contatos ativos podem ser definidos como principais.',
      );
    }

    await this.prisma.$transaction([
      (this.prisma as any).customerContact.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      }),
      (this.prisma as any).customerContact.update({
        where: { id: contactId },
        data: { isPrimary },
      }),
    ]);

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryContact(customerId, customer.contacts as any);

    return this.getCustomerById(customerId);
  }

  async createCustomerAddress(
    customerId: string,
    input: CreateCustomerAddressDto,
  ) {
    await this.ensureCustomerExists(customerId);

    await this.prisma.address.create({
      data: {
        customerId,
        label: input.label.trim(),
        recipient: input.recipient.trim(),
        zipCode: this.normalizeZipCode(input.zipCode),
        street: input.street.trim(),
        number: input.number.trim(),
        complement: input.complement?.trim() || null,
        neighborhood: input.neighborhood.trim(),
        city: input.city.trim(),
        state: input.state.trim().toUpperCase(),
        country: input.country?.trim().toUpperCase() || 'BR',
      } as any,
    });

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryAddress(customerId, customer.addresses as any);

    return this.getCustomerById(customerId);
  }

  async updateCustomerAddressStatus(
    customerId: string,
    addressId: string,
    isActive: boolean,
  ) {
    const address = (await this.prisma.address.findFirst({
      where: { id: addressId, customerId },
    })) as any;

    if (!address) {
      throw new NotFoundException('Endereco nao encontrado.');
    }

    await this.prisma.address.update({
      where: { id: addressId },
      data: {
        isActive,
        isPrimary: isActive ? address.isPrimary : false,
      } as any,
    });

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryAddress(customerId, customer.addresses as any);

    return this.getCustomerById(customerId);
  }

  async setPrimaryCustomerAddress(
    customerId: string,
    addressId: string,
    isPrimary: boolean,
  ) {
    const address = (await this.prisma.address.findFirst({
      where: { id: addressId, customerId },
    })) as any;

    if (!address) {
      throw new NotFoundException('Endereco nao encontrado.');
    }

    if (!address.isActive) {
      throw new BadRequestException(
        'Apenas enderecos ativos podem ser definidos como padrao.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { customerId },
        data: { isPrimary: false } as any,
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isPrimary } as any,
      }),
    ]);

    const customer = (await this.getCustomerWithRelations(customerId)) as any;
    await this.ensurePrimaryAddress(customerId, customer.addresses as any);

    return this.getCustomerById(customerId);
  }

  private async ensureCustomerUniqueness(input: {
    email: string;
    document: string;
    googleId?: string | null;
    ignoreCustomerId?: string;
  }) {
    const duplicatedCustomer = (await this.prisma.customer.findFirst({
      where: {
        OR: [
          { email: input.email },
          { document: input.document },
          ...(input.googleId ? ([{ googleId: input.googleId }] as any[]) : []),
        ],
        NOT: input.ignoreCustomerId ? { id: input.ignoreCustomerId } : undefined,
      },
      select: {
        email: true,
        document: true,
        googleId: true,
      } as any,
    })) as any;

    if (!duplicatedCustomer) {
      return;
    }

    if (duplicatedCustomer.email === input.email) {
      throw new ConflictException('Customer email already in use.');
    }

    if (duplicatedCustomer.document === input.document) {
      throw new ConflictException('Customer document already in use.');
    }

    throw new ConflictException('Customer Google account already linked.');
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }
  }

  private async getCustomerWithRelations(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: this.customerIncludes() as any,
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return customer;
  }

  private async ensurePrimaryContact(
    customerId: string,
    contacts: Array<{ id: string; isActive: boolean; isPrimary: boolean }>,
  ) {
    const activeContacts = contacts.filter((contact) => contact.isActive);

    if (activeContacts.length === 0) {
      return;
    }

    const currentPrimary = activeContacts.find((contact) => contact.isPrimary);

    if (currentPrimary) {
      return;
    }

    await (this.prisma as any).customerContact.update({
      where: { id: activeContacts[0].id },
      data: { isPrimary: true } as any,
    });
  }

  private async ensurePrimaryAddress(
    _customerId: string,
    addresses: Array<{ id: string; isActive: boolean; isPrimary: boolean }>,
  ) {
    const activeAddresses = addresses.filter((address) => address.isActive);

    if (activeAddresses.length === 0) {
      return;
    }

    const currentPrimary = activeAddresses.find((address) => address.isPrimary);

    if (currentPrimary) {
      return;
    }

    await this.prisma.address.update({
      where: { id: activeAddresses[0].id },
      data: { isPrimary: true } as any,
    });
  }

  private normalizeZipCode(zipCode: string) {
    return zipCode.replace(/\D/g, '');
  }

  private customerIncludes() {
    return {
      contacts: { orderBy: { createdAt: 'asc' as const } },
      addresses: { orderBy: { createdAt: 'asc' as const } },
      orders: { select: { id: true } },
      carts: { select: { id: true } },
    };
  }

  private mapCustomer(customer: {
    id: string;
    name: string;
    email: string;
    googleId: string | null;
    documentType: string;
    document: string;
    phone: string | null;
    birthDate: Date | null;
    isActive: boolean;
    contacts: Array<{
      id: string;
      name: string;
      role: string | null;
      email: string | null;
      phone: string | null;
      isPrimary: boolean;
      isActive: boolean;
    }>;
    addresses: Array<{
      id: string;
      label: string;
      recipient: string;
      zipCode: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      isPrimary: boolean;
      isActive: boolean;
    }>;
    orders: Array<{ id: string }>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      googleId: customer.googleId,
      documentType: customer.documentType,
      document: customer.document,
      phone: customer.phone,
      birthDate: customer.birthDate?.toISOString() ?? null,
      isActive: customer.isActive,
      addressesCount: customer.addresses.length,
      ordersCount: customer.orders.length,
      contacts: customer.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
      })),
      addresses: customer.addresses.map((address) => ({
        id: address.id,
        label: address.label,
        recipient: address.recipient,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: address.country,
        isPrimary: address.isPrimary,
        isActive: address.isActive,
      })),
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  private getBcryptSaltRounds() {
    return Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '10');
  }
}
