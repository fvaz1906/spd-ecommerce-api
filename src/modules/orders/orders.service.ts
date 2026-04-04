import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  getOverview() {
    return {
      context: 'orders',
      features: ['checkout', 'orders', 'items'],
      endpoints: ['GET /api/orders/overview'],
    };
  }
}
