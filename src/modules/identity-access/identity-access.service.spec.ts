import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdentityAccessRepository } from './identity-access.repository';
import { IdentityAccessService } from './identity-access.service';

describe('IdentityAccessService', () => {
  it('registers a new customer', async () => {
    const repository = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      findUserById: jest.fn(),
      createCustomerAccount: jest.fn().mockResolvedValue({
        id: 'customer-1',
        name: 'Felipe',
        email: 'felipe@example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as IdentityAccessRepository;

    const jwtService = {} as JwtService;
    const mailService = {} as never;
    const service = new IdentityAccessService(repository, jwtService, mailService);

    const result = await service.register({
      name: 'Felipe',
      email: 'felipe@example.com',
      password: '12345678',
      document: '12345678900',
    });

    expect(result.email).toBe('felipe@example.com');
  });

  it('rejects duplicated email', async () => {
    const repository = {
      findUserByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Felipe',
        email: 'felipe@example.com',
        passwordHash: 'hash',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findUserById: jest.fn(),
      createCustomerAccount: jest.fn(),
    } as unknown as IdentityAccessRepository;

    const jwtService = {} as JwtService;
    const mailService = {} as never;
    const service = new IdentityAccessService(repository, jwtService, mailService);

    await expect(
      service.register({
        name: 'Felipe',
        email: 'felipe@example.com',
        password: '12345678',
        document: '12345678900',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
