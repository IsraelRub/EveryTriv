import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const RequireUserStatus = (...statuses: string[]) => SetMetadata('requireUserStatus', statuses);

export const RequireEmailVerified = () => SetMetadata('requireEmailVerified', true);
