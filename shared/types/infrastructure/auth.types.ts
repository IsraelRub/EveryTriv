/**
 * Authentication Types
 * @module AuthTypes
 * @description Authentication and authorization related types
 */
// Import BasicUser from domain
import type { Request } from 'express';

import { UserRole } from '../../constants';
import type { BasicUser } from '../domain/user';

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

// User Data
export interface UserData {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	isActive: boolean;
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
	error?: string;
	payload?: TokenPayload;
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

export interface GoogleAuthPayload {
	google_id: string;
	email?: string;
	username?: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
}

export interface GoogleAuthRequest extends Request {
	user?: GoogleAuthPayload;
}

// JWT Decoded Token
export interface JWTDecodedToken {
	sub: string;
	email: string;
	username: string;
	role: UserRole;
	iat?: number;
	exp?: number;
}
