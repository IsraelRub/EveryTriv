/**
 * User types
 * @module ClientUserTypes
 * @used_by client/src/views/user, client/src/services/auth, client/src/hooks/api
 */
import type { AuthCredentials } from '@shared/types';

/**
 * User login request
 * @used_by client/src/services/auth, client/src/hooks/api
 */
export interface UserLoginRequest {
	email: string;
	password: string;
	rememberMe?: boolean;
}

/**
 * User register request
 * @used_by client/src/services/auth, client/src/views/registration
 */
export interface UserRegisterRequest extends AuthCredentials {
	confirmPassword: string;
	firstName?: string;
	lastName?: string;
	favoriteTopics?: string[];
}
