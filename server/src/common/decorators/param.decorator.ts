import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { VALIDATORS } from '@shared/validation';

export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	if (VALIDATORS.string(data) && data !== '' && user != null && typeof user === 'object') {
		const value = Reflect.get(user, data);
		if (VALIDATORS.string(value) && value !== '') {
			return value;
		}
	}
	return user?.sub ?? null;
});

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	if (VALIDATORS.string(data) && data !== '' && user != null && typeof user === 'object') {
		return Reflect.get(user, data) ?? null;
	}
	return user ?? null;
});
