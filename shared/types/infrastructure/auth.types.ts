// Authentication Types.
// Import BasicUser from domain
import type { Request } from 'express';

import { UserRole } from '../../constants';
import type { BasicUser } from '../domain/user';

export interface AuthenticationResult {
	user?: BasicUser;
	accessToken?: string;
	refreshToken?: string;
	message?: string;
	error?: string;
}

export interface AuthCredentials {
	email: string;
	password: string;
}

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

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export interface TokenValidationResult {
	isValid: boolean;
	error?: string;
	payload?: TokenPayload;
}

export interface AuthenticationRequest {
	headers?: Record<string, string | string[] | undefined>;
	cookies?: Record<string, string | undefined>;
	authToken?: string;
}

export interface AuthRequest {
	user: BasicUser;
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

export interface JWTDecodedToken {
	sub: string;
	email: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}
