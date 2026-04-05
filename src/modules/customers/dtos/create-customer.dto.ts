import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_REGEX,
} from '@/core/security/password.policy';

const customerDocumentTypeValues = [
  'CPF',
  'CNPJ',
  'PASSPORT',
  'OTHER',
] as const;
type CustomerDocumentTypeValue = (typeof customerDocumentTypeValues)[number];

export class CreateCustomerDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: customerDocumentTypeValues, example: 'CPF' })
  @IsEnum(customerDocumentTypeValues)
  documentType!: CustomerDocumentTypeValue;

  @ApiProperty({ example: '12345678900' })
  @IsString()
  document!: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1993-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'Cliente@123',
    description:
      'Senha inicial da conta do cliente para o ecommerce. Pode ficar vazia enquanto o site publico nao estiver ativo.',
  })
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'google-oauth2|1234567890',
    description:
      'Reservado para quando o ecommerce permitir login e cadastro com Google.',
  })
  @IsOptional()
  @IsString()
  googleId?: string;
}
