import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	if (typeof data === 'string' && data !== '' && user != null && typeof user === 'object') {
		const value = Reflect.get(user, data);
		if (typeof value === 'string' && value !== '') {
			return value;
		}
	}
	return user?.sub ?? null;
});

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	if (typeof data === 'string' && data !== '' && user != null && typeof user === 'object') {
		return Reflect.get(user, data) ?? null;
	}
	return user ?? null;
});
