import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithProxyMetadata = {
  headers?: Record<string, string | string[] | undefined>;
  ips?: string[];
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: RequestWithProxyMetadata): Promise<string> {
    const forwardedFor = req.headers?.['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return Promise.resolve(forwardedFor.split(',')[0].trim());
    }

    if (Array.isArray(req.ips) && req.ips.length > 0) {
      return Promise.resolve(req.ips[0]);
    }

    return Promise.resolve(req.ip ?? req.socket?.remoteAddress ?? 'anonymous');
  }
}
