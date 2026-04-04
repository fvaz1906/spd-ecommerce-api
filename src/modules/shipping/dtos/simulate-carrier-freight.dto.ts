import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SimulateCarrierFreightDto {
  @ApiProperty({ example: 1800 })
  @IsInt()
  @Min(1)
  weightGrams!: number;

  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(1)
  lengthCm!: number;

  @ApiProperty({ example: 18 })
  @IsInt()
  @Min(1)
  widthCm!: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  heightCm!: number;
}
