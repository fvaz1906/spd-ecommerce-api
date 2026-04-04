import { ApiProperty } from '@nestjs/swagger';
import { CarrierStatus } from '@prisma/client';
import { CarrierFreightRuleResponseDto } from './carrier-freight-rule.responses';

export class ShippingOverviewResponseDto {
  @ApiProperty({ example: 'shipping' })
  context!: string;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty({ type: [String] })
  endpoints!: string[];

  @ApiProperty()
  totalCarriers!: number;

  @ApiProperty()
  activeCarriers!: number;

  @ApiProperty()
  inactiveCarriers!: number;
}

export class CarrierResponseDto {
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

  @ApiProperty()
  averageFreightCostInCents!: number;

  @ApiProperty({ type: [CarrierFreightRuleResponseDto] })
  freightRules!: CarrierFreightRuleResponseDto[];

  @ApiProperty({
    type: [Object],
    example: [
      {
        id: 'clx1',
        name: 'Mariana Lopes',
        role: 'Operacoes',
        email: 'mariana@rapidosul.com.br',
        phone: '11988887777',
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

  @ApiProperty({ enum: CarrierStatus })
  status!: CarrierStatus;

  @ApiProperty()
  createdAt!: string;
}

export class CarrierDeleteResponseDto {
  @ApiProperty({ example: 'Transportadora removida com sucesso.' })
  message!: string;
}

export class CarrierZipCodeLookupResponseDto {
  @ApiProperty({ example: '01001-000' })
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
