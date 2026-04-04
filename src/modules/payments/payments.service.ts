import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  getOverview() {
    return {
      context: 'payments',
      features: ['pix', 'boleto', 'cards'],
      endpoints: ['GET /api/payments/overview'],
    };
  }
}
