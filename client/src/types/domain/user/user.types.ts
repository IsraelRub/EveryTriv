import type { AuthCredentials } from '@shared/types';

export interface UserLoginRequest {
	email: string;
	password: string;
	rememberMe?: boolean;
}

export interface UserRegisterRequest extends AuthCredentials {
	confirmPassword: string;
	firstName?: string;
	lastName?: string;
}
