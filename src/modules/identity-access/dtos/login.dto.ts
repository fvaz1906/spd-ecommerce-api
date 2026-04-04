import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'felipe@example.com',
    description: 'E-mail cadastrado do usuário.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '12345678',
    minLength: 8,
    description: 'Senha do usuário.',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
