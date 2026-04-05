import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

  @ApiOperation({ summary: 'Cadastrar conta de cliente do ecommerce' })
  @ApiCreatedResponse({ type: RegisteredUserResponseDto })
  @Throttle({
    default: {
      limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? '5'),
      ttl: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000'),
    },
  })
  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.identityAccessService.register(body);
  }

  @ApiOperation({ summary: 'Autenticar usuario interno do sistema' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais invalidas.' })
  @Throttle({
    default: {
      limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? '5'),
      ttl: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000'),
      blockDuration: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000') * 5,
    },
  })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.identityAccessService.login(body);
  }

  @ApiOperation({
    summary: 'Solicitar codigo de recuperacao de senha para usuario interno',
  })
  @ApiOkResponse({ type: GenericMessageResponseDto })
  @Throttle({
    default: {
      limit: Math.max(
        1,
        Math.floor(Number(process.env.AUTH_RATE_LIMIT_MAX ?? '5') / 2),
      ),
      ttl: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000'),
      blockDuration:
        Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000') * 10,
    },
  })
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.identityAccessService.forgotPassword(body);
  }

  @ApiOperation({
    summary: 'Redefinir senha de usuario interno com codigo temporario',
  })
  @ApiOkResponse({ type: GenericMessageResponseDto })
  @Throttle({
    default: {
      limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? '5'),
      ttl: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000'),
      blockDuration:
        Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000') * 10,
    },
  })
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.identityAccessService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obter usuario interno autenticado' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
  })
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.identityAccessService.me(user.sub);
  }
}
