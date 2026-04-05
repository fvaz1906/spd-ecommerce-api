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
import { CartService } from './cart.service';

@ApiTags('Cart')
@ApiBearerAuth('bearer')
@ApiForbiddenResponse({ description: 'Acesso restrito a usuarios internos.' })
@Roles('admin', 'manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Visao geral do carrinho' })
  @ApiOkResponse({ type: IdentityOverviewResponseDto })
  @Get('overview')
  overview() {
    return this.cartService.getOverview();
  }
}
