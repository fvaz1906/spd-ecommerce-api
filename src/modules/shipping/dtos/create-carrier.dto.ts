import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCarrierDto {
  @ApiProperty({ example: 'Rapido Sul Transportes LTDA' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Rapido Sul' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tradeName?: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @MaxLength(30)
  document!: string;

  @ApiPropertyOptional({ example: '2019-03-10' })
  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @ApiPropertyOptional({ example: 'atendimento@rapidosul.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1133334444' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 2890 })
  @IsInt()
  @Min(0)
  averageFreightCostInCents!: number;

  @ApiPropertyOptional({
    example: 'Transportadora homologada para entregas urbanas e fracionadas.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
