import { ApiProperty } from '@nestjs/swagger';
import { SupplierStatus } from '@prisma/client';

export class SuppliersOverviewResponseDto {
  @ApiProperty({ example: 'suppliers' })
  context!: string;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty({ type: [String] })
  endpoints!: string[];

  @ApiProperty()
  totalSuppliers!: number;

  @ApiProperty()
  activeSuppliers!: number;

  @ApiProperty()
  inactiveSuppliers!: number;
}

export class SupplierResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  tradeName!: string | null;

  @ApiProperty()
  document!: string;

  @ApiProperty({ nullable: true })
  openedAt!: string | null;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ nullable: true })
  contactName!: string | null;

  @ApiProperty({
    type: [Object],
    example: [
      {
        id: 'clx1',
        name: 'Juliana Costa',
        role: 'Comercial',
        email: 'juliana@fornecedor.com.br',
        phone: '11999999999',
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
    isActive: boolean;
  }>;

  @ApiProperty({
    type: [Object],
    example: [
      {
        id: 'clx2',
        zipCode: '01001000',
        street: 'Rua das Flores',
        number: '120',
        complement: null,
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        country: 'BR',
        isActive: true,
      },
    ],
  })
  addresses!: Array<{
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

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ enum: SupplierStatus })
  status!: SupplierStatus;

  @ApiProperty()
  createdAt!: string;
}

export class SupplierDeleteResponseDto {
  @ApiProperty({ example: 'Fornecedor removido com sucesso.' })
  message!: string;
}

export class SupplierZipCodeLookupResponseDto {
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
