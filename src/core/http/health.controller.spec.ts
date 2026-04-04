import { HealthController } from './health.controller';
import { PrismaService } from '@/core/prisma/prisma.service';

describe('HealthController', () => {
  it('returns application health payload', async () => {
    const prismaService = {
      checkHealth: jest.fn().mockResolvedValue('up'),
    } as unknown as PrismaService;

    const controller = new HealthController(prismaService);
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.app).toBe('spd-ecommerce-api');
    expect(result.boundedContexts).toContain('orders');
  });
});
