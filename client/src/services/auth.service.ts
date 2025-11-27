/**
 * Authentication service for EveryTriv client
 * Handles user authentication, login, logout, and token management
 *
 * @module ClientAuthService
 * @description Client-side authentication service with token management
 * @used_by client/hooks/api/useAuth.ts, client/views/registration/RegistrationView.tsx, client/components/user/OAuthCallback.tsx
 */
import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { AuthCredentials, AuthenticationResult, BasicUser, User, UserProfileResponseType } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { ensureErrorObject } from '@shared/utils/core/error.utils';

import { CLIENT_STORAGE_KEYS } from '../constants';
import { isUser } from '../utils/data.utils';
import { ApiConfig, apiService } from './api.service';
import { storageService } from './storage.service';

/**
 * Main authentication service class
 * @class AuthService
 * @description Handles all authentication operations for the client
 * @used_by client/hooks/useAuth.ts, client/views/auth
 */
class AuthService {
	private readonly TOKEN_KEY = CLIENT_STORAGE_KEYS.AUTH_TOKEN;
	private readonly USER_KEY = CLIENT_STORAGE_KEYS.AUTH_USER;

	/**
	 * Authenticate user with credentials
	 * @param credentials User login credentials
	 * @returns Authentication response with token and user data
	 * @throws When authentication fails
	 */
	async login(credentials: AuthCredentials): Promise<AuthenticationResult> {
		try {
			logger.securityLogin('Attempting to login user', { email: credentials.email });

			const response = await apiService.login(credentials);

			// Store auth data
			await this.setAuthData(response);

			if (response.user) {
				logger.logUserActivity(response.user.id, 'login', { email: credentials.email });
			}
			return response;
		} catch (error) {
			logger.securityDenied('Login failed', { error: getErrorMessage(error), email: credentials.email });
			throw error;
		}
	}

	/**
	 * Register user account
	 * @param credentials User registration credentials including email
	 * @returns Authentication response after successful registration
	 * @throws When registration fails
	 */
	async register(credentials: AuthCredentials & { email: string }): Promise<AuthenticationResult> {
		try {
			logger.authRegister('Attempting to register user', { email: credentials.email });

			const response = await apiService.register(credentials);

			// Store auth data
			await this.setAuthData(response);

			if (response.user) {
				logger.authRegister('User registered successfully', { userId: response.user.id });
			}
			return response;
		} catch (error) {
			logger.authError(ensureErrorObject(error), 'Registration failed', {
				email: credentials.email,
			});
			throw error;
		}
	}

	/**
	 * Logout user and clear session
	 * @returns Resolves when logout is complete
	 */
	async logout(): Promise<void> {
		try {
			logger.authLogout('Logging out user');

			// Clear auth data
			await this.clearAuthData();

			// Call API logout
			await apiService.logout();

			logger.authLogout('User logged out successfully');
		} catch (error) {
			logger.authError(ensureErrorObject(error), 'Logout failed');
			// Clear local data even if API call fails
			await this.clearAuthData();
		}
	}

	/**
	 * Get user info
	 * @returns Current user data
	 */
	async getCurrentUser(): Promise<BasicUser> {
		try {
			const user = await apiService.getCurrentUser();

			// Update stored user data
			await storageService.set(this.USER_KEY, user);

			return {
				...user,
				role: user.role || UserRole.USER, // Provide default role if not set
			};
		} catch (error) {
			logger.authError(ensureErrorObject(error), 'Failed to get current user');
			throw error;
		}
	}

	/**
	 * Refresh authentication token
	 * @returns New authentication result with refreshed tokens
	 */
	async refreshToken(): Promise<AuthenticationResult> {
		try {
			logger.authTokenRefresh('Refreshing auth token');

			const response = await apiService.refreshToken();

			// Get current user data to construct full response
			const user = await this.getStoredUser();
			if (!user) {
				throw new Error('No user data found');
			}

			// Get existing refresh token from storage
			const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
			const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
			if (!refreshToken) {
				throw new Error('No refresh token available');
			}

			const fullResponse: AuthenticationResult = {
				user,
				accessToken: response.accessToken,
				refreshToken,
			};

			// Update auth data
			await this.setAuthData(fullResponse);

			logger.authTokenRefresh('Token refreshed successfully');
			return fullResponse;
		} catch (error) {
			logger.authError(ensureErrorObject(error), 'Token refresh failed');
			await this.clearAuthData();
			throw error;
		}
	}

	/**
	 * Check if user is authenticated
	 * @returns True if user is authenticated, false otherwise
	 */
	async isAuthenticated(): Promise<boolean> {
		return await apiService.isAuthenticated();
	}

	/**
	 * Get auth token
	 * @returns Authentication token or null if not available
	 */
	async getToken(): Promise<string | null> {
		return await apiService.getAuthToken();
	}

	/**
	 * Get user from storage
	 * @returns Stored user data or null if not found
	 */
	async getStoredUser(): Promise<User | null> {
		const result = await storageService.get<User>(this.USER_KEY, isUser);
		return result.success && result.data ? result.data : null;
	}

	/**
	 * Get auth state
	 * @returns Current authentication state with user and token
	 */
	async getAuthState(): Promise<{
		isAuthenticated: boolean;
		user: User | null;
		token: string | null;
	}> {
		const token = await this.getToken();
		const user = await this.getStoredUser();

		return {
			isAuthenticated: !!token && !!user,
			user,
			token,
		};
	}

	/**
	 * Store authentication data
	 * Note: Token is already stored by apiService.login(), only store user data here
	 */
	private async setAuthData(authResponse: AuthenticationResult): Promise<void> {
		// Token is already stored by apiService.login() with 'access_token' key
		// Only store user data here to avoid duplication
		if (authResponse.user) {
			await storageService.set(this.USER_KEY, authResponse.user);
		}
	}

	/**
	 * Initiate Google OAuth login
	 * Redirects user to Google OAuth authentication page
	 * @returns Resolves when redirect is initiated
	 */
	async initiateGoogleLogin(): Promise<void> {
		try {
			logger.securityLogin('Initiating Google OAuth login');

			// Redirect to Google OAuth endpoint
			const googleAuthUrl = ApiConfig.getGoogleAuthUrl();

			logger.authInfo('Redirecting to Google OAuth', {
				url: googleAuthUrl,
			});

			window.location.href = googleAuthUrl;
		} catch (error) {
			logger.securityDenied('Google login initiation failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Complete user profile after registration
	 * @param profileData Profile completion data
	 * @returns Completed user profile data
	 */
	async completeProfile(profileData: {
		firstName: string;
		lastName?: string;
		avatar?: string;
	}): Promise<UserProfileResponseType> {
		try {
			logger.authProfileUpdate('Completing user profile');

			const profileResponse = await apiService.updateUserProfile({
				firstName: profileData.firstName,
				lastName: profileData.lastName,
				avatar: profileData.avatar,
			});

			logger.authProfileUpdate('Profile completed successfully');
			return profileResponse;
		} catch (error) {
			logger.authError('Profile completion failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Update user profile
	 */
	async updateUserProfile(profileData: {
		firstName?: string;
		lastName?: string;
		avatar?: string;
		email?: string;
	}): Promise<UserProfileResponseType> {
		try {
			logger.authProfileUpdate('Updating user profile');

			const profileResponse = await apiService.updateUserProfile(profileData);

			logger.authProfileUpdate('Profile updated successfully');
			return profileResponse;
		} catch (error) {
			logger.authError('Profile update failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Change user password
	 */
	async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
		try {
			logger.authProfileUpdate('Changing user password');

			const response = await apiService.changePassword(currentPassword, newPassword);

			logger.authProfileUpdate('Password changed successfully');
			return response;
		} catch (error) {
			logger.authError('Password change failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Clear authentication data
	 */
	private async clearAuthData(): Promise<void> {
		// Clear all auth-related storage keys
		await storageService.delete(this.TOKEN_KEY); // 'access_token'
		await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN); // 'refresh_token'
		await storageService.delete(this.USER_KEY); // 'auth_user'
	}
}

export const authService = new AuthService();
