import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'felipe@example.com',
    description: 'E-mail da conta que solicitou a recuperacao.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '482915',
    description: 'Codigo de 6 digitos enviado por e-mail.',
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({
    example: 'novaSenha123',
    minLength: 8,
    description: 'Nova senha desejada.',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'novaSenha123',
    minLength: 8,
    description: 'Confirmacao da nova senha.',
  })
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}
