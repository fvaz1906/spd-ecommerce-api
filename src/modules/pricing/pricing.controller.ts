import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/core/security/roles.decorator';
import { RolesGuard } from '@/core/security/roles.guard';
import { IdentityOverviewResponseDto } from '@/modules/identity-access/dtos/identity-access.responses';
import { JwtAuthGuard } from '@/modules/identity-access/jwt-auth.guard';
import { PricingService } from './pricing.service';

@ApiTags('Pricing')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @ApiOperation({ summary: 'Visao geral de precificacao' })
  @ApiOkResponse({ type: IdentityOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.pricingService.getOverview();
  }
}
