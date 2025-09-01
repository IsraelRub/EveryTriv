import { UserPreferencesUpdate } from './user.types';

/**
 * Authentication-related types for EveryTriv
 * Shared between client and server
 *
 * @module AuthTypes
 * @description Authentication interfaces and data structures
 */

/**
 * User authentication credentials interface
 * @interface AuthCredentials
 * @description Login form data structure
 * @used_by client/src/views/registration/RegistrationView.tsx (RegistrationView.handleLogin), client/src/components/user/CompleteProfile.tsx (profile completion forms)
 */
export interface AuthCredentials extends Record<string, unknown> {
	/** Username for login */
	username: string;
	/** User email address */
	email: string;
	/** User password */
	password: string;
}

/**
 * Server authentication response interface
 * @interface AuthResponse
 * @description Complete authentication response from server
 * @used_by client/src/services/auth.service.ts (AuthService.login, AuthService.register), client/src/hooks/api/useAuth.ts (useLogin.onSuccess, useRegister.onSuccess)
 */
export interface AuthResponse {
	/** JWT access token */
	access_token: string;
	/** User profile information */
	user: {
		/** User ID */
		id: string;
		/** Username */
		username: string;
		/** Email address */
		email: string;
		/** Avatar URL */
		avatar?: string;
		/** User score */
		score: number;
		/** Credit balance */
		credits: number;
		/** User role */
		role: string;
		/** Full display name */
		full_name?: string;
		/** Account creation timestamp */
		created_at: Date;
		/** Last update timestamp */
		updated_at: Date;
	};
}

/**
 * Current authentication state interface
 * @interface AuthState
 * @description Current user authentication status
 * @used_by client/src/hooks/useAuth, client/src/components/auth
 */
export interface AuthState {
	/** Whether user is currently authenticated */
	isAuthenticated: boolean;
	/** Current user profile data */
	user: AuthResponse['user'] | null;
	/** Current authentication token */
	token: string | null;
}

/**
 * User profile update data interface
 * @interface UpdateProfileData
 * @description Data structure for updating user profile information
 * @used_by client/src/services/user, client/src/components/user
 */
export interface UpdateProfileData {
	/** User's first name */
	first_name?: string;
	/** User's last name */
	last_name?: string;
	/** User's full name */
	full_name?: string;
	/** User's avatar URL */
	avatar?: string;
	/** User's email address */
	email?: string;
	/** User preferences */
	preferences?: UserPreferencesUpdate;
}

/**
 * Profile completion data interface
 * @interface CompleteProfileData
 * @description Data structure for completing user profile after registration
 * @used_by client/src/components/user/CompleteProfile.tsx (profile completion)
 */
export interface CompleteProfileData {
	/** User's full name */
	full_name: string;
	/** User's avatar URL */
	avatar?: string;
}

/**
 * JWT payload interface
 * @interface JWTPayload
 * @description JWT token payload structure
 */
export interface JWTPayload {
	/** User ID */
	id: string;
	/** Username */
	username: string;
	/** Email */
	email: string;
	/** User role */
	role: string;
	/** Token issued at */
	iat: number;
	/** Token expiration */
	exp: number;
}

/**
 * Auth request interface
 * @interface AuthRequest
 * @description Authenticated request structure
 */
export interface AuthRequest {
	/** User information */
	user: {
		/** User ID */
		id: string;
		/** Username */
		username: string;
		/** Email */
		email: string;
		/** User role */
		role: string;
	};
	/** Request headers */
	headers: Record<string, string>;
	/** Request body */
	body: Record<string, unknown>;
	/** Request parameters */
	params: Record<string, string>;
	/** Query parameters */
	query: Record<string, string>;
}
