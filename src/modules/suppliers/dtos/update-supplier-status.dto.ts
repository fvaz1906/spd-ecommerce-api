import { ApiProperty } from '@nestjs/swagger';
import { SupplierStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSupplierStatusDto {
  @ApiProperty({ enum: SupplierStatus, example: SupplierStatus.INACTIVE })
  @IsEnum(SupplierStatus)
  status!: SupplierStatus;
}
