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
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Visao geral de pagamentos' })
  @ApiOkResponse({ type: IdentityOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.paymentsService.getOverview();
  }
}
