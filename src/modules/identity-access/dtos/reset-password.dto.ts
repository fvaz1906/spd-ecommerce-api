import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_REGEX,
} from '@/core/security/password.policy';

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
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Nova senha desejada.',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;

  @ApiProperty({
    example: 'novaSenha123',
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Confirmacao da nova senha.',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  confirmPassword!: string;
}
