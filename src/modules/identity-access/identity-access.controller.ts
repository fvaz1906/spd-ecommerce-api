import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import {
  CurrentUserResponseDto,
  GenericMessageResponseDto,
  IdentityOverviewResponseDto,
  LoginResponseDto,
  RegisteredUserResponseDto,
} from './dtos/identity-access.responses';
import { RegisterUserDto } from './dtos/register-user.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { IdentityAccessService } from './identity-access.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './jwt-payload.type';

@ApiTags('Identity Access')
@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @ApiOperation({ summary: 'Visao geral do modulo de autenticacao' })
  @ApiOkResponse({ type: IdentityOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.identityAccessService.getOverview();
  }

  @ApiOperation({ summary: 'Cadastrar cliente' })
  @ApiCreatedResponse({ type: RegisteredUserResponseDto })
  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.identityAccessService.register(body);
  }

  @ApiOperation({ summary: 'Autenticar usuario' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais invalidas.' })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.identityAccessService.login(body);
  }

  @ApiOperation({
    summary: 'Solicitar codigo de recuperacao de senha',
  })
  @ApiOkResponse({ type: GenericMessageResponseDto })
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.identityAccessService.forgotPassword(body);
  }

  @ApiOperation({
    summary: 'Redefinir senha com codigo temporario',
  })
  @ApiOkResponse({ type: GenericMessageResponseDto })
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.identityAccessService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obter usuario autenticado' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
  })
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.identityAccessService.me(user.sub);
  }
}
