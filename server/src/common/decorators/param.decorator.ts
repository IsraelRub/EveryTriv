/**
 * Parameter Decorators
 *
 * @module ParamDecorators
 * @description Custom parameter decorators for extracting request data
 * @author EveryTriv Team
 */
import { createParamDecorator,ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserRole as UserRoleEnum } from '@shared/constants';

/**
 * Get request IP address
 * @returns Parameter decorator that extracts client IP
 */
export const ClientIP = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.ip || request.connection.remoteAddress || 'unknown';
});

/**
 * Get user agent from request
 * @returns Parameter decorator that extracts user agent
 */
export const UserAgent = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.headers['user-agent'] || 'unknown';
});

/**
 * Get current user from request
 * @returns Parameter decorator that extracts current user
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.user || null;
});

/**
 * Decorator to extract user information from request with optional property access
 * @param data - Optional property name to extract from user object
 * @param ctx - Execution context
 * @returns User object or specific property
 */
export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	const user = request.user;

	return data ? user?.[data] : user;
});

/**
 * Get user role from request
 * @returns Parameter decorator that extracts user role
 */
export const UserRole = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.userRole || UserRoleEnum.GUEST;
});

/**
 * Get the current authenticated user ID
 * @returns Parameter decorator that extracts the user ID from request
 * @throws UnauthorizedException if user is not authenticated
 */
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	const user = request.user;

	if (!user || !user.id) {
		throw new UnauthorizedException('User not authenticated');
	}

	return user.id;
});

/**
 * Get request ID from headers or generate one
 * @returns Parameter decorator that extracts or generates request ID
 */
export const RequestID = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return (
		request.headers['x-request-id'] ||
		request.headers['x-correlation-id'] ||
		`req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	);
});

/**
 * Get request timestamp
 * @returns Parameter decorator that extracts request timestamp
 */
export const RequestTimestamp = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.timestamp || new Date();
});

/**
 * Get request headers
 * @param headerName Optional specific header name
 * @returns Parameter decorator that extracts request headers
 */
export const RequestHeaders = createParamDecorator((headerName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return headerName ? request.headers[headerName] : request.headers;
});

/**
 * Get request query parameters
 * @param paramName Optional specific query parameter name
 * @returns Parameter decorator that extracts query parameters
 */
export const QueryParams = createParamDecorator((paramName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return paramName ? request.query[paramName] : request.query;
});

/**
 * Get request body
 * @param propertyName Optional specific body property name
 * @returns Parameter decorator that extracts request body
 */
export const RequestBody = createParamDecorator((propertyName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return propertyName ? request.body[propertyName] : request.body;
});

/**
 * Get request cookies
 * @param cookieName Optional specific cookie name
 * @returns Parameter decorator that extracts request cookies
 */
export const RequestCookies = createParamDecorator((cookieName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return cookieName ? request.cookies[cookieName] : request.cookies;
});

/**
 * Get request session
 * @param propertyName Optional specific session property name
 * @returns Parameter decorator that extracts request session
 */
export const RequestSession = createParamDecorator((propertyName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return propertyName ? request.session?.[propertyName] : request.session;
});

/**
 * Get request file(s)
 * @param fieldName Optional specific file field name
 * @returns Parameter decorator that extracts request files
 */
export const RequestFiles = createParamDecorator((fieldName: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return fieldName ? request.files?.[fieldName] : request.files;
});

/**
 * Get request language from Accept-Language header
 * @returns Parameter decorator that extracts request language
 */
export const RequestLanguage = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	const acceptLanguage = request.headers['accept-language'];
	return acceptLanguage ? acceptLanguage.split(',')[0].trim() : 'en';
});

/**
 * Get request timezone from headers
 * @returns Parameter decorator that extracts request timezone
 */
export const RequestTimezone = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.headers['x-timezone'] || 'UTC';
});
