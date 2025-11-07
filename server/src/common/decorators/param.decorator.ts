/**
 * Parameter Decorators
 *
 * @module ParamDecorators
 * @description Custom parameter decorators for extracting user information from requests
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get the current authenticated user ID
 * @returns The user ID (sub field from JWT payload) or null if not authenticated
 * @example
 * async getProfile(@CurrentUserId() userId: string) { }
 */
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const user = ctx.switchToHttp().getRequest()?.user;
	return user?.sub || null;
});

/**
 * Get the current authenticated user
 * @returns The full user object (JWT payload) or null if not authenticated
 * @example
 * async getProfile(@CurrentUser() user: TokenPayload) { }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	return ctx.switchToHttp().getRequest()?.user || null;
});
