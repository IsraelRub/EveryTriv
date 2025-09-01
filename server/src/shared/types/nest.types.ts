import { NextFunction, Request, Response } from 'express';

/**
 * NestJS-specific types for the server
 */

// NestJS request/response types
export type NestRequest = Request & {
	authToken?: string;
	country?: string;
	userRole?: string;
};
export type NestResponse = Response;
export type NestNextFunction = NextFunction;

// Cookie interface
export interface CookieData {
	name: string;
	value: string;
	domain?: string;
	path?: string;
	expires?: Date;
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
	signed?: boolean;
}

// Authenticated request interface
export interface AuthenticatedRequest {
	user: {
		id: string;
		email: string;
		username: string;
		role: string;
	};
	cookies?: CookieData[];
	headers: Record<string, string>;
	body: Record<string, unknown>;
	params: Record<string, string>;
	query: Record<string, string>;
}

// Request context interface
export interface RequestContext {
	requestId: string;
	userId?: string;
	sessionId?: string;
	timestamp: Date;
	ipAddress: string;
	userAgent: string;
	method: string;
	url: string;
	headers: Record<string, string>;
	user?: {
		id: string;
		email: string;
		username: string;
		role: string;
	};
}
