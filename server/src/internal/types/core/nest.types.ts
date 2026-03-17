import { Request, Response } from 'express';

import type { UserRole } from '@shared/constants';

import type { TokenPayload } from '../domain/auth.types';

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
	user?: TokenPayload;
}
