import { applyDecorators, Header, SetMetadata } from '@nestjs/common';

export const Cache = (ttl: number, key?: string) => SetMetadata('cache', { ttl, key });

export const NoCache = () =>
	applyDecorators(
		SetMetadata('cache', { ttl: 0, disabled: true }),
		Header('Cache-Control', 'no-store, no-cache, must-revalidate'),
		Header('Pragma', 'no-cache'),
		Header('Expires', '0')
	);
