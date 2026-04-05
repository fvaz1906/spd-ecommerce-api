import { ApiProperty } from '@nestjs/swagger';

const customerDocumentTypeValues = ['CPF', 'CNPJ', 'PASSPORT', 'OTHER'] as const;

export class CustomersOverviewResponseDto {
  @ApiProperty({ example: 'customers' })
  context!: string;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty({ type: [String] })
  endpoints!: string[];

  @ApiProperty()
  totalCustomers!: number;

  @ApiProperty()
  activeCustomers!: number;

  @ApiProperty()
  withOrders!: number;
}

export class CustomerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true, example: 'google-oauth2|1234567890' })
  googleId!: string | null;

  @ApiProperty({ enum: customerDocumentTypeValues, example: 'CPF' })
  documentType!: string;

  @ApiProperty()
  document!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ nullable: true })
  birthDate!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  addressesCount!: number;

  @ApiProperty()
  ordersCount!: number;

  @ApiProperty({
    type: [Object],
    example: [
      {
        id: 'ctc_1',
        name: 'Maria Financeiro',
        role: 'Financeiro',
        email: 'financeiro@cliente.com.br',
        phone: '11999999999',
        isPrimary: true,
        isActive: true,
      },
    ],
  })
  contacts!: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
    isActive: boolean;
  }>;

  @ApiProperty({
    type: [Object],
    example: [
      {
        id: 'adr_1',
        label: 'Casa',
        recipient: 'Maria da Silva',
        zipCode: '01001000',
        street: 'Praca da Se',
        number: '120',
        complement: null,
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        country: 'BR',
        isPrimary: true,
        isActive: true,
      },
    ],
  })
  addresses!: Array<{
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

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CustomerZipCodeLookupResponseDto {
  @ApiProperty({ example: '01001000' })
  zipCode!: string;

  @ApiProperty({ example: 'Praca da Se' })
  street!: string;

  @ApiProperty({ example: '- lado par', nullable: true })
  complement!: string | null;

  @ApiProperty({ example: 'Se' })
  neighborhood!: string;

  @ApiProperty({ example: 'Sao Paulo' })
  city!: string;

  @ApiProperty({ example: 'SP' })
  state!: string;
}
