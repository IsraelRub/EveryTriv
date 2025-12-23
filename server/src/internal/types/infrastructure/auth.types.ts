/**
 * Server Authentication Types
 * @module ServerAuthTypes
 * @description Server-side authentication type definitions
 */
import type { Request } from 'express';

import { UserRole } from '@shared/constants';

/**
 * User Data interface
 * @interface UserData
 * @description User data structure for server-side operations
 */
export interface UserData {
	id: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	isActive: boolean;
}

/**
 * Token Pair interface
 * @interface TokenPair
 * @description Pair of access and refresh tokens
 */
export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

/**
 * Token Validation Result interface
 * @interface TokenValidationResult
 * @description Result of token validation
 */
export interface TokenValidationResult {
	isValid: boolean;
	error?: string;
	payload?: {
		sub: string;
		email: string;
		role: UserRole;
		iat?: number;
		exp?: number;
	};
}

/**
 * Authentication Request interface
 * @interface AuthenticationRequest
 * @description Request structure for authentication operations
 */
export interface AuthenticationRequest {
	headers?: Record<string, string | string[] | undefined>;
	cookies?: Record<string, string | undefined>;
	authToken?: string;
}

/**
 * Google Auth Payload interface
 * @interface GoogleAuthPayload
 * @description Payload from Google OAuth authentication
 */
export interface GoogleAuthPayload {
	googleId: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	avatar?: number;
}

/**
 * Google Auth Request interface
 * @interface GoogleAuthRequest
 * @description Request with Google authentication payload
 */
export interface GoogleAuthRequest extends Request {
	user?: GoogleAuthPayload;
}

/**
 * Token Payload interface
 * @interface TokenPayload
 * @description JWT token payload structure (moved from shared - server-only)
 * @used_by server/src/common/auth/jwt-token.service.ts, server/src/features/auth/auth.controller.ts
 */
export interface TokenPayload {
	sub: string;
	email: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}

/**
 * Token User Data interface
 * @interface TokenUserData
 * @description User data for token generation
 * @used_by server/src/common/auth/jwt-token.service.ts
 */
export interface TokenUserData {
	id: string;
	email: string;
	role: UserRole;
}
