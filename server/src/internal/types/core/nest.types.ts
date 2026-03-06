import { Request, Response } from 'express';

import type { UserRole } from '@shared/constants';

export interface CacheConfig {
	ttl: number;
	key?: string;
	tags?: string[];
	disabled?: boolean;
	condition?: (request: NestRequest, response: Response) => boolean;
}

export interface NestRequest extends Request {
	authToken?: string;
	userRole?: UserRole;
	user?: UserPayload;
}

export interface UserPayload {
	sub: string;
	email: string;
	role: UserRole;
	iat: number;
	exp: number;
}
