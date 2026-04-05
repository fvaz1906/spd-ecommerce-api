import { ApiProperty } from '@nestjs/swagger';

export class OrdersOverviewResponseDto {
  @ApiProperty()
  context!: string;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty({ type: [String] })
  endpoints!: string[];

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  paidOrders!: number;

  @ApiProperty()
  shippedOrders!: number;

  @ApiProperty()
  revenueInCents!: number;
}

export class OrderCreationOptionsResponseDto {
  @ApiProperty({ type: [Object] })
  customers!: object[];

  @ApiProperty({ type: [Object] })
  carriers!: object[];

  @ApiProperty({ type: [Object] })
  products!: object[];

  @ApiProperty({ type: [String] })
  paymentMethods!: string[];

  @ApiProperty({ type: [String] })
  orderSources!: string[];
}

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty({ nullable: true })
  customerDocument!: string | null;

  @ApiProperty({ nullable: true })
  customerPhone!: string | null;

  @ApiProperty()
  itemsCount!: number;

  @ApiProperty()
  subtotalInCents!: number;

  @ApiProperty()
  discountInCents!: number;

  @ApiProperty()
  shippingInCents!: number;

  @ApiProperty()
  totalInCents!: number;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ nullable: true })
  internalNotes!: string | null;

  @ApiProperty({ type: Object })
  shippingAddress!: object;

  @ApiProperty({ type: Object, nullable: true })
  billingAddress!: object | null;

  @ApiProperty({ type: [Object] })
  items!: object[];

  @ApiProperty({ type: [Object] })
  payments!: object[];

  @ApiProperty({ type: [Object] })
  shipments!: object[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
