import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Financeiro' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  role?: string;

  @ApiPropertyOptional({ example: 'financeiro@cliente.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
