import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'felipe@example.com',
    description: 'E-mail cadastrado que recebera o codigo de recuperacao.',
  })
  @IsEmail()
  email!: string;
}
