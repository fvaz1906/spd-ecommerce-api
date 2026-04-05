import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Maria da Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    enum: customerDocumentTypeValues,
    example: 'CPF',
  })
  @IsOptional()
  @IsEnum(customerDocumentTypeValues)
  documentType?: CustomerDocumentTypeValue;

  @ApiPropertyOptional({ example: '12345678900' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1993-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Permite ativar ou desativar a conta do cliente.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'NovaSenha@123',
    description: 'Atualiza a senha da conta do cliente quando informado.',
  })
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password?: string;

  @ApiPropertyOptional({
    example: 'google-oauth2|1234567890',
    description:
      'Reservado para vinculo futuro da conta do cliente com Google.',
  })
  @IsOptional()
  @IsString()
  googleId?: string;
}
