import { ApiProperty } from '@nestjs/swagger';

export class IdentityOverviewResponseDto {
  @ApiProperty({ example: 'identity-access' })
  context!: string;

  @ApiProperty({ example: ['User'] })
  aggregates!: string[];

  @ApiProperty({
    example: [
      'Controle de perfis internos: admin e gerente',
      'Autenticacao e autorizacao do painel administrativo',
      'Recuperacao de senha para usuarios internos',
    ],
  })
  capabilities!: string[];
}

export class RegisteredUserResponseDto {
  @ApiProperty({ example: 'cm8xyz123' })
  id!: string;

  @ApiProperty({ example: 'Felipe Vaz' })
  name!: string;

  @ApiProperty({ example: 'felipe@example.com' })
  email!: string;

  @ApiProperty({ example: 'customer' })
  role!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-03-25T23:00:00.000Z' })
  createdAt!: Date;
}

export class AuthenticatedUserDto {
  @ApiProperty({ example: 'cm8xyz123' })
  id!: string;

  @ApiProperty({ example: 'Felipe Vaz' })
  name!: string;

  @ApiProperty({ example: 'felipe@example.com' })
  email!: string;

  @ApiProperty({ example: 'admin' })
  role!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature',
  })
  accessToken!: string;

  @ApiProperty({ type: AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}

export class CurrentUserResponseDto {
  @ApiProperty({ example: 'cm8xyz123' })
  id!: string;

  @ApiProperty({ example: 'Felipe Vaz' })
  name!: string;

  @ApiProperty({ example: 'felipe@example.com' })
  email!: string;

  @ApiProperty({ example: 'admin' })
  role!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-03-25T23:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-25T23:10:00.000Z' })
  updatedAt!: Date;
}

export class GenericMessageResponseDto {
  @ApiProperty({
    example:
      'Se o e-mail estiver cadastrado, um codigo de recuperacao foi enviado.',
  })
  message!: string;
}
