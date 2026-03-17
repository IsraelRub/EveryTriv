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

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}
