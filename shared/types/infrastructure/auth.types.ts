/**
 * Authentication Types
 * @module AuthTypes
 * @description Authentication and authorization related types
 */

// Import BasicUser from domain
import type { BasicUser } from '../domain/user/user.types';

// Authentication Result
export interface AuthenticationResult {
	user?: BasicUser;
	accessToken?: string;
	refreshToken?: string;
	message?: string;
	error?: string;
}


// Login Credentials
export interface LoginCredentials {
	username: string;
	password: string;
}

// Authentication Credentials (alias for LoginCredentials with email)
export interface AuthCredentials {
	email: string;
	username: string;
	password: string;
}

import { UserRole } from '../../constants/business/info.constants';

// User Data
export interface UserData {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	isActive: boolean;
}

// Authentication Config
export interface AuthenticationConfig {
	enableRefreshTokens?: boolean;
	accessTokenExpiry?: string;
	refreshTokenExpiry?: string;
	requireEmailVerification?: boolean;
	requirePhoneVerification?: boolean;
}

// Token Payload
export interface TokenPayload {
	sub: string;
	email: string;
	username: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}

// Token Pair
export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

// Token Validation Result
export interface TokenValidationResult {
	isValid: boolean;
	payload?: TokenPayload;
	error?: string;
}

// Password Validation Result - imported from validation.types.ts
export type { PasswordValidationResult } from '../domain/validation/validation.types';

// Password Config
export interface PasswordConfig {
	saltRounds?: number;
	minLength?: number;
	maxLength?: number;
	requireUppercase?: boolean;
	requireLowercase?: boolean;
	requireNumbers?: boolean;
	requireSpecialChars?: boolean;
}

// Request Types for Authentication
export interface AuthenticationRequest {
	headers?: Record<string, string | string[] | undefined>;
	cookies?: Record<string, string | undefined>;
	authToken?: string;
}

// Auth Request (for authenticated endpoints)
export interface AuthRequest {
	user: BasicUser;
}

// JWT Decoded Token
export interface JWTDecodedToken extends Record<string, unknown> {
	sub: string;
	email: string;
	username: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}
