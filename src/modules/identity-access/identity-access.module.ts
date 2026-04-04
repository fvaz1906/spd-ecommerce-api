import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { IdentityAccessController } from './identity-access.controller';
import { IdentityAccessMailService } from './mail.service';
import { IdentityAccessRepository } from './identity-access.repository';
import { IdentityAccessService } from './identity-access.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            (configService.get<string>('JWT_EXPIRES_IN') as StringValue) ??
            '1d',
        },
      }),
    }),
  ],
  controllers: [IdentityAccessController],
  providers: [
    IdentityAccessRepository,
    IdentityAccessService,
    IdentityAccessMailService,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class IdentityAccessModule {}
