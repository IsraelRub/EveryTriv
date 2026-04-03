import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { TypedSocket } from '@internal/types';

export const WsCurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const client = ctx.switchToWs().getClient<TypedSocket>();
	const user = client.data.user;
	if (typeof data === 'string' && data !== '' && user != null && typeof user === 'object') {
		const value = Reflect.get(user, data);
		if (typeof value === 'string' && value !== '') {
			return value;
		}
	}
	return user?.sub ?? null;
});
