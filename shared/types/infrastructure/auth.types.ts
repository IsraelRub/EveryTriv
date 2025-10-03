/**
 * Authentication Types
 * @module AuthTypes
 * @description Authentication and authorization related types
 */

// Current User Data
export interface CurrentUserData {
	id: string;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	role: string;
	avatar?: string;
	createdAt: Date;
}

// Authentication Result
export interface AuthenticationResult {
	success: boolean;
	user?: Pick<CurrentUserData, 'id' | 'username' | 'email' | 'role'>;
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

// User Data
export interface UserData {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	role: string;
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
	role: string;
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
	headers?: {
		authorization?: string;
	} & Record<string, string | undefined>;
	cookies?: {
		auth_token?: string;
	} & Record<string, string | undefined>;
	authToken?: string;
}

// JWT Decoded Token
export interface JWTDecodedToken extends Record<string, unknown> {
	sub: string;
	email: string;
	username: string;
	role: string;
	iat?: number;
	exp?: number;
}
