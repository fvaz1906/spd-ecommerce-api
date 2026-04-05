import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCustomerPrimaryRecordDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPrimary!: boolean;
}
