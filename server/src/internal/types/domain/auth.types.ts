import type { Request } from 'express';

import type { UserRole } from '@shared/constants';

export interface UserData {
	id: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	isActive: boolean;
}

export interface TokenPayload {
	sub: string;
	email: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}

export interface AuthenticatedUserPayload extends TokenPayload {
	role: UserRole;
}

export interface TokenValidationResult {
	isValid: boolean;
	error?: string;
	payload?: TokenPayload;
}

export interface GoogleAuthPayload {
	googleId: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
}

export interface GoogleAuthRequest extends Request {
	user?: GoogleAuthPayload;
}
