import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierContactDto {
  @ApiProperty({ example: 'Juliana Costa' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Comercial' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  role?: string;

  @ApiPropertyOptional({ example: 'juliana@fornecedor.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateSupplierAddressDto {
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

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuidora Paulista LTDA' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Distribuidora Paulista' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tradeName?: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @MaxLength(30)
  document!: string;

  @ApiPropertyOptional({ example: '2021-05-10' })
  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @ApiPropertyOptional({ example: 'contato@fornecedor.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Juliana Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional({ type: [CreateSupplierContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierContactDto)
  contacts?: CreateSupplierContactDto[];

  @ApiPropertyOptional({ type: [CreateSupplierAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierAddressDto)
  addresses?: CreateSupplierAddressDto[];

  @ApiPropertyOptional({
    example: 'Fornecedor homologado para embalagens e descartaveis.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
