import { SetMetadata } from '@nestjs/common';
import type { AppUserRole } from '@/modules/identity-access/identity-access.repository';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppUserRole[]) => SetMetadata(ROLES_KEY, roles);
