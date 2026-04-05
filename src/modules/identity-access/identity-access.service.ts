import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import {
  AppUserRole,
  IdentityAccessRepository,
} from './identity-access.repository';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { IdentityAccessMailService } from './mail.service';

@Injectable()
export class IdentityAccessService {
  constructor(
    private readonly repository: IdentityAccessRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: IdentityAccessMailService,
    private readonly configService: ConfigService,
  ) {}

  getOverview() {
    return {
      context: 'identity-access',
      features: [
        'system-login',
        'system-me',
        'forgot-password',
        'reset-password',
      ],
      endpoints: [
        'POST /api/identity-access/login',
        'POST /api/identity-access/forgot-password',
        'POST /api/identity-access/reset-password',
        'GET /api/identity-access/me',
      ],
    };
  }

  async register(body: RegisterUserDto) {
    if (!body.document) {
      throw new BadRequestException(
        'Document is required to register a customer account.',
      );
    }

    const existingUser = await this.repository.findUserByEmail(
      body.email.toLowerCase(),
    );

    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const passwordHash = await hash(body.password, this.getBcryptSaltRounds());

    const customer = await this.repository.createCustomerAccount({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
      document: body.document,
      phone: body.phone,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    });

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'customer',
      isActive: customer.isActive,
      createdAt: customer.createdAt,
    };
  }

  async login(body: LoginDto) {
    const user = await this.repository.findUserByEmail(
      body.email.toLowerCase(),
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.role === 'customer') {
      throw new UnauthorizedException(
        'Acesso permitido apenas para usuarios internos do sistema.',
      );
    }

    const passwordMatches = await compare(body.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const user = await this.repository.findUserByEmail(
      body.email.toLowerCase(),
    );

    if (!user) {
      return {
        message:
          'Se o e-mail estiver cadastrado, um codigo de recuperacao foi enviado.',
      };
    }

    if (user.role === 'customer') {
      return {
        message:
          'Se o e-mail estiver cadastrado, um codigo de recuperacao foi enviado.',
      };
    }

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await this.repository.invalidateActivePasswordResetCodes(user.id);
    await this.repository.storePasswordResetCode({
      userId: user.id,
      code,
      expiresAt,
    });
    await this.mailService.sendPasswordResetCode({
      to: user.email,
      name: user.name,
      code,
    });

    return {
      message:
        'Se o e-mail estiver cadastrado, um codigo de recuperacao foi enviado.',
    };
  }

  async resetPassword(body: ResetPasswordDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match.');
    }

    const validResetCode = await this.repository.findValidPasswordResetCode({
      email: body.email.toLowerCase(),
      code: body.code,
    });

    if (!validResetCode) {
      throw new BadRequestException('Invalid or expired reset code.');
    }

    const passwordHash = await hash(body.password, this.getBcryptSaltRounds());

    await this.repository.updateUserPassword(
      validResetCode.userId,
      passwordHash,
    );
    await this.repository.markPasswordResetCodeAsUsed(validResetCode.id);
    await this.repository.invalidateActivePasswordResetCodes(
      validResetCode.userId,
    );

    return {
      message: 'Password updated successfully.',
    };
  }

  async me(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateUser(userId: string): Promise<{
    sub: string;
    email: string;
    role: AppUserRole;
  }> {
    const user = await this.repository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (user.role === 'customer') {
      throw new UnauthorizedException('Invalid access token.');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private getBcryptSaltRounds() {
    return Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '10');
  }
}
