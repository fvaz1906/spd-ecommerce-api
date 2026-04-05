import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/core/prisma/prisma.service';
import { HealthCheckResponseDto } from './health-check-response.dto';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @ApiOperation({
    summary: 'Healthcheck da aplicacao',
    description:
      'Retorna o status da API, o status da conexao com o banco e os modulos registrados.',
  })
  @ApiOkResponse({
    description: 'Aplicacao saudavel.',
    type: HealthCheckResponseDto,
  })
  @Get()
  async check() {
    const databaseStatus = process.env.DATABASE_URL
      ? await this.prismaService.checkHealth()
      : 'not-configured';

    return {
      status: 'ok',
      app: 'spd-ecommerce-api',
      database: databaseStatus,
      boundedContexts: [
        'identity-access',
        'customers',
        'catalog',
        'inventory',
        'pricing',
        'cart',
        'orders',
        'shipping',
        'payments',
      ],
    };
  }
}
