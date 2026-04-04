import { Injectable } from '@nestjs/common';

@Injectable()
export class CartService {
  getOverview() {
    return {
      context: 'cart',
      features: ['cart', 'items', 'coupon'],
      endpoints: ['GET /api/cart/overview'],
    };
  }
}
