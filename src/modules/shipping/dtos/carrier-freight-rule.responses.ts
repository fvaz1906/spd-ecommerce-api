import { ApiProperty } from '@nestjs/swagger';

export class CarrierFreightRuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  serviceCode!: string | null;

  @ApiProperty()
  minWeightGrams!: number;

  @ApiProperty()
  maxWeightGrams!: number;

  @ApiProperty()
  minLengthCm!: number;

  @ApiProperty()
  maxLengthCm!: number;

  @ApiProperty()
  minWidthCm!: number;

  @ApiProperty()
  maxWidthCm!: number;

  @ApiProperty()
  minHeightCm!: number;

  @ApiProperty()
  maxHeightCm!: number;

  @ApiProperty()
  baseFreightCostInCents!: number;

  @ApiProperty()
  additionalCostPerKgInCents!: number;

  @ApiProperty({ nullable: true })
  deliveryDays!: number | null;

  @ApiProperty()
  isActive!: boolean;
}

export class CarrierFreightSimulationResponseDto {
  @ApiProperty()
  ruleId!: string;

  @ApiProperty()
  ruleName!: string;

  @ApiProperty()
  freightCostInCents!: number;

  @ApiProperty()
  weightGrams!: number;

  @ApiProperty()
  billableWeightGrams!: number;

  @ApiProperty({ nullable: true })
  deliveryDays!: number | null;
}
