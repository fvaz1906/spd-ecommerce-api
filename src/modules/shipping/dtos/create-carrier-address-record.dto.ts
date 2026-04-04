import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCarrierAddressRecordDto {
  @ApiProperty({ example: '01001000' })
  @IsString()
  @MaxLength(20)
  zipCode!: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  @MaxLength(160)
  street!: string;

  @ApiProperty({ example: '120' })
  @IsString()
  @MaxLength(20)
  number!: string;

  @ApiPropertyOptional({ example: 'Sala 5' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @MaxLength(120)
  neighborhood!: string;

  @ApiProperty({ example: 'Sao Paulo' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @MaxLength(40)
  state!: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;
}
