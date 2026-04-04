import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ nullable: true })
  document!: string | null;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  addressesCount!: number;

  @ApiProperty()
  ordersCount!: number;

  @ApiProperty()
  createdAt!: string;
}
