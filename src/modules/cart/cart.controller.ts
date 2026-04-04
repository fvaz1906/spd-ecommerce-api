import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdentityOverviewResponseDto } from '@/modules/identity-access/dtos/identity-access.responses';
import { CartService } from './cart.service';

@ApiTags('Cart')
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
