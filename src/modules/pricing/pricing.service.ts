import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  getOverview() {
    return {
      context: 'pricing',
      features: ['coupons', 'discounts', 'campaigns'],
      endpoints: ['GET /api/pricing/overview'],
    };
  }
}
