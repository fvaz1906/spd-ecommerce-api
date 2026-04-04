import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'spd-ecommerce-api' })
  app!: string;

  @ApiProperty({
    example: 'up',
    enum: ['up', 'down', 'not-configured'],
  })
  database!: 'up' | 'down' | 'not-configured';

  @ApiProperty({
    example: [
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
  })
  boundedContexts!: string[];
}
