import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdentityOverviewResponseDto } from '@/modules/identity-access/dtos/identity-access.responses';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
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
