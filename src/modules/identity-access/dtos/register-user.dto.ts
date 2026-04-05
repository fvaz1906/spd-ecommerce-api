import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
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

export class RegisterUserDto {
  @ApiProperty({
    example: 'Felipe Vaz',
    description: 'Nome completo do cliente.',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'felipe@example.com',
    description: 'E-mail unico para autenticacao.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '12345678',
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Senha do usuario com no minimo 8 caracteres.',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;

  @ApiPropertyOptional({
    example: '12345678900',
    description: 'Documento do cliente. Obrigatorio no cadastro publico.',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: '11999999999',
    description: 'Telefone do cliente.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '1993-06-15',
    description: 'Data de nascimento em formato ISO.',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
