import { SetMetadata } from '@nestjs/common';

export const Cache = (ttl: number, key?: string) => SetMetadata('cache', { ttl, key });

export const NoCache = () => SetMetadata('cache', { ttl: 0, disabled: true });
