/**
 * Authentication service for EveryTriv client
 * Handles user authentication, login, logout, and token management
 *
 * @module ClientAuthService
 * @description Client-side authentication service with token management
 * @used_by client/hooks/api/useAuth.ts (useLogin, useRegister, useLogout), client/views/registration/RegistrationView.tsx (RegistrationView component), client/components/user/OAuthCallback.tsx (OAuthCallback component)
 */
import { AuthCredentials, AuthResponse, AuthState, User } from 'everytriv-shared/types';

import { apiService } from '../api';
import { storageService } from '../storage';
import { loggerService } from '../utils';

/**
 * Main authentication service class
 * @class AuthService
 * @description Handles all authentication operations for the client
 * @used_by client/hooks/useAuth, client/views/auth
 */
class AuthService {
	/** Local storage key for auth token */
	private readonly TOKEN_KEY = 'auth_token';
	/** Local storage key for user data */
	private readonly USER_KEY = 'auth_user';

	/**
	 * Authenticate user with credentials
	 * @param {AuthCredentials} credentials - User login credentials
	 * @returns {Promise<ClientAuthService>} Authentication response with token and user data
	 * @throws {Error} When authentication fails
	 */
	async login(credentials: AuthCredentials): Promise<AuthResponse> {
		try {
			loggerService.securityLogin('Attempting to login user', { username: credentials.username });

			const response = await apiService.login(credentials);

			// Store auth data
			this.setAuthData(response);

			loggerService.logUserActivity(response.user.id, 'login', { username: credentials.username });
			return response;
		} catch (error) {
			loggerService.securityDenied('Login failed', { error, username: credentials.username });
			throw error;
		}
	}

	/**
	 * Register new user account
	 * @param {AuthCredentials & { email: string }} credentials - User registration data
	 * @returns {Promise<ClientAuthService>} Authentication response after successful registration
	 * @throws {Error} When registration fails
	 */
	async register(credentials: AuthCredentials & { email: string }): Promise<AuthResponse> {
		try {
			loggerService.authRegister('Attempting to register user', { username: credentials.username });

			const response = await apiService.register(credentials);

			// Store auth data
			this.setAuthData(response);

			loggerService.authRegister('User registered successfully', { userId: response.user.id });
			return response;
		} catch (error) {
			loggerService.errorWithStack(error instanceof Error ? error : new Error(String(error)), 'Registration failed', {
				username: credentials.username,
			});
			throw error;
		}
	}

	/**
	 * Logout current user and clear session
	 * @returns {Promise<void>} Resolves when logout is complete
	 */
	async logout(): Promise<void> {
		try {
			loggerService.authLogout('Logging out user');

			// Clear auth data
			this.clearAuthData();

			// Call API logout
			await apiService.logout();

			loggerService.authLogout('User logged out successfully');
		} catch (error) {
			loggerService.authError('Logout failed', { error });
			// Clear local data even if API call fails
			this.clearAuthData();
		}
	}

	/**
	 * Get current user info
	 */
	async getCurrentUser(): Promise<AuthResponse['user']> {
		try {
			const user = (await apiService.getCurrentUser()) as User;

			// Update stored user data
			storageService.setItem(this.USER_KEY, user);

			return {
				...user,
				role: user.role || 'user', // Provide default role if not set
			};
		} catch (error) {
			loggerService.errorWithStack(
				error instanceof Error ? error : new Error(String(error)),
				'Failed to get current user'
			);
			throw error;
		}
	}

	/**
	 * Refresh authentication token
	 */
	async refreshToken(): Promise<AuthResponse> {
		try {
			loggerService.authTokenRefresh('Refreshing auth token');

			const response = (await apiService.refreshToken()) as AuthResponse;

			// Update auth data
			this.setAuthData(response);

			loggerService.authTokenRefresh('Token refreshed successfully');
			return response;
		} catch (error) {
			loggerService.errorWithStack(error instanceof Error ? error : new Error(String(error)), 'Token refresh failed');
			this.clearAuthData();
			throw error;
		}
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return apiService.isAuthenticated();
	}

	/**
	 * Get current auth token
	 */
	getToken(): string | null {
		return apiService.getAuthToken();
	}

	/**
	 * Get current user from storage
	 */
	async getStoredUser(): Promise<AuthResponse['user'] | null> {
		const result = await storageService.getItem<AuthResponse['user']>(this.USER_KEY);
		return result.success && result.data ? result.data : null;
	}

	/**
	 * Get current auth state
	 */
	async getAuthState(): Promise<AuthState> {
		const token = this.getToken();
		const user = await this.getStoredUser();

		return {
			isAuthenticated: !!token && !!user,
			user,
			token,
		};
	}

	/**
	 * Store authentication data
	 */
	private setAuthData(authResponse: AuthResponse): void {
		storageService.setItem(this.TOKEN_KEY, authResponse.access_token);
		storageService.setItem(this.USER_KEY, authResponse.user);
	}

	/**
	 * Initiate Google OAuth login
	 */
	async initiateGoogleLogin(): Promise<void> {
		try {
			loggerService.securityLogin('Initiating Google OAuth login');

			// Redirect to Google OAuth endpoint
			const googleAuthUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002'}/auth/google`;
			window.location.href = googleAuthUrl;
		} catch (error) {
			loggerService.securityDenied('Google login initiation failed', { error });
			throw error;
		}
	}

	/**
	 * Complete user profile after registration
	 */
	async completeProfile(profileData: {
		fullName: string;
		avatar?: string;
		address?: {
			country?: string;
			state?: string;
			city?: string;
			street?: string;
			zipCode?: string;
			apartment?: string;
		};
	}): Promise<AuthResponse['user']> {
		try {
			loggerService.authProfileUpdate('Completing user profile');

			// Split fullName into firstName and lastName
			const nameParts = profileData.fullName.split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';

			const updatedUser = (await apiService.updateProfile({
				full_name: `${firstName} ${lastName}`.trim(),
				avatar: profileData.avatar,
				address: profileData.address,
			})) as User;

			// Update stored user data
			storageService.setItem(this.USER_KEY, updatedUser);

			loggerService.authProfileUpdate('Profile completed successfully', { userId: updatedUser.id });
			// Add role property to match AuthResponse user type
			return {
				...updatedUser,
				role: 'user',
			};
		} catch (error) {
			loggerService.authError('Profile completion failed', { error });
			throw error;
		}
	}

	/**
	 * Update user profile
	 */
	async updateProfile(profileData: {
		firstName?: string;
		lastName?: string;
		avatar?: string;
		email?: string;
	}): Promise<AuthResponse['user']> {
		try {
			loggerService.authProfileUpdate('Updating user profile');

			const updatedUser = (await apiService.updateProfile(profileData)) as User;

			// Update stored user data
			storageService.setItem(this.USER_KEY, updatedUser);

			loggerService.authProfileUpdate('Profile updated successfully', { userId: updatedUser.id });
			// Add role property to match AuthResponse user type
			return {
				...updatedUser,
				role: 'user',
			};
		} catch (error) {
			loggerService.authError('Profile update failed', { error });
			throw error;
		}
	}

	/**
	 * Clear authentication data
	 */
	private clearAuthData(): void {
		storageService.removeItem(this.TOKEN_KEY);
		storageService.removeItem(this.USER_KEY);
	}
}

export const authService = new AuthService();
