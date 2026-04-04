import { ApiProperty } from '@nestjs/swagger';
import { CarrierStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCarrierStatusDto {
  @ApiProperty({ enum: CarrierStatus, example: CarrierStatus.ACTIVE })
  @IsEnum(CarrierStatus)
  status!: CarrierStatus;
}
