import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { VALIDATORS } from '@shared/validation';

import type { TypedSocket } from '@internal/types';

export const WsCurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const client = ctx.switchToWs().getClient<TypedSocket>();
	const user = client.data.user;
	if (VALIDATORS.string(data) && data !== '' && user != null && typeof user === 'object') {
		const value = Reflect.get(user, data);
		if (VALIDATORS.string(value) && value !== '') {
			return value;
		}
	}
	return user?.sub ?? null;
});
