import type { UserRole } from '@shared/constants';
import type { AuthCredentials } from '@shared/types';

export interface UseUserRoleReturn {
	role: UserRole | undefined;
	isAdmin: boolean;
}

export interface CompleteProfileParams {
	firstName: string;
	lastName?: string;
}

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
