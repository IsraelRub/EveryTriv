import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { TypedSocket } from '@internal/types';

export const WsCurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const client = ctx.switchToWs().getClient<TypedSocket>();
	const user = client.data.user;
	return user?.sub ?? null;
});
