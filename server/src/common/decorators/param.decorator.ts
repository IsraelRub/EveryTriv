import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	return user?.sub ?? null;
});

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	return ctx.switchToHttp().getRequest()?.user ?? null;
});
