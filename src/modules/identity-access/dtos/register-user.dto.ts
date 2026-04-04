import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'Felipe Vaz',
    description: 'Nome completo do cliente.',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'felipe@example.com',
    description: 'E-mail único para autenticação.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '12345678',
    minLength: 8,
    description: 'Senha do usuário com no mínimo 8 caracteres.',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: '12345678900',
    description: 'Documento do cliente. Obrigatório no cadastro público.',
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
