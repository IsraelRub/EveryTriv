/**
 * Authentication service for EveryTriv client
 * Handles user authentication, login, logout, and token management
 *
 * @module ClientAuthService
 * @description Client-side authentication service with token management
 * @used_by client/hooks/api/useAuth.ts, client/views/registration/RegistrationView.tsx, client/components/auth/OAuthCallback.tsx
 */
import { API_ROUTES, ERROR_MESSAGES, UserRole } from '@shared/constants';
import type {
	AuthCredentials,
	AuthenticationResult,
	BasicUser,
	ChangePasswordData,
	UserProfileResponseType,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { ensureErrorObject } from '@shared/utils/core/error.utils';
import { CLIENT_STORAGE_KEYS } from '@/constants';
import { ApiConfig, apiService, clientLogger as logger, storageService, userService } from '@/services';

/**
 * Main authentication service class
 * @class AuthService
 * @description Handles all authentication operations for the client
 * @used_by client/hooks/useAuth.ts, client/views/auth
 */
class AuthService {
	private readonly TOKEN_KEY = CLIENT_STORAGE_KEYS.AUTH_TOKEN;


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
	async register(
		credentials: AuthCredentials & { firstName?: string; lastName?: string }
	): Promise<AuthenticationResult> {
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
			logger.authDebug('Logging out user');

			// Call API logout FIRST (before clearing tokens, so server can validate the request)
			await apiService.logout();

			// Clear auth data AFTER successful API call
			// Note: apiService.logout() already clears tokens in its finally block,
			// but we also clear user data from storage here
			await this.clearAuthData();

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
			// Get current token for logging
			const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			const token = tokenResult.success ? tokenResult.data : null;

			// Decode token to get user info for logging
			let tokenUserId: string | undefined = undefined;
			let tokenEmail: string | undefined = undefined;
			if (token) {
				try {
					const tokenParts = token.split('.');
					if (tokenParts.length === 3 && tokenParts[1] != null) {
						const payload = JSON.parse(atob(tokenParts[1]));
						tokenUserId = payload.sub;
						tokenEmail = payload.email;
					}
				} catch {
					// Ignore decode errors
				}
			}

			logger.authInfo('Getting current user from server', {
				tokenLength: token?.length || 0,
				tokenUserId,
				tokenEmail,
			});

			const user = await apiService.getCurrentUser();

			logger.authInfo('Current user received from server', {
				userId: user.id,
				email: user.email,
				userType: user.role,
				tokenMatches: tokenUserId === user.id,
				tokenUserId,
				serverUserId: user.id,
			});

			// Note: User data is stored in sessionStorage via Redux Persist, not in localStorage
			// Redux state will be updated by the calling hook/component

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

			// Get current user data from server (user state is in sessionStorage via Redux Persist)
			const user = await this.getCurrentUser();

			// Get existing refresh token from storage
			const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
			const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
			if (!refreshToken) {
				throw new Error(ERROR_MESSAGES.api.NO_REFRESH_TOKEN_AVAILABLE);
			}

			const fullResponse: AuthenticationResult = {
				user,
				accessToken: response.accessToken,
				refreshToken,
			};

			// Note: User data is stored in sessionStorage via Redux Persist, not here
			// Token is already stored by apiService.refreshToken()

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
	 * Get auth state
	 * @returns Current authentication state with token
	 * Note: User data is stored in sessionStorage via Redux Persist, not in localStorage
	 * Use Redux state to get user data instead
	 */
	async getAuthState(): Promise<{
		isAuthenticated: boolean;
		token: string | null;
	}> {
		const token = await this.getToken();

		return {
			isAuthenticated: !!token,
			token,
		};
	}

	/**
	 * Store authentication data
	 * Note: Token is already stored by apiService.register/login()
	 * User data is stored in sessionStorage via Redux Persist, not here
	 */
	private async setAuthData(authResponse: AuthenticationResult): Promise<void> {
		// Token is already stored by apiService.register/login() with 'access_token' key
		// User data is stored in sessionStorage via Redux Persist by the calling hook/component
		// No need to store user data here to avoid duplication
		if (authResponse.user) {
			logger.authInfo('Authentication data ready - user will be stored in Redux/sessionStorage', {
				userId: authResponse.user.id,
				email: authResponse.user.email,
			});
		}
	}

	/**
	 * Wait for token to be stored (with polling)
	 * Used to ensure token is available before updating Redux state
	 * @param maxAttempts Maximum number of polling attempts (default: 10)
	 * @param delayMs Delay between attempts in milliseconds (default: 50)
	 * @returns True if token was stored, false otherwise
	 */
	async waitForTokenStorage(maxAttempts: number = 10, delayMs: number = 50): Promise<boolean> {
		let attempts = 0;
		while (attempts < maxAttempts) {
			const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			if (tokenResult.success && !!tokenResult.data) {
				return true;
			}
			await new Promise(resolve => setTimeout(resolve, delayMs));
			attempts++;
		}
		return false;
	}

	/**
	 * Verify stored token matches user
	 * Used to ensure token and user data are consistent before updating Redux
	 * @param userId User ID to verify against
	 * @returns True if token matches user, false otherwise
	 */
	async verifyStoredTokenForUser(userId: string): Promise<boolean> {
		const { authSyncService } = await import('@/services');
		return authSyncService.verifyStoredTokenMatchesUser(userId);
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
			const googleAuthUrl = `${ApiConfig.getBaseUrl()}${API_ROUTES.AUTH.GOOGLE}`;

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
	async completeProfile(profileData: { firstName: string; lastName?: string }): Promise<UserProfileResponseType> {
		try {
			logger.authProfileUpdate('Completing user profile');

			// Note: avatar is set through dedicated /users/avatar endpoint, not through profile update
			const profileResponse = await userService.updateUserProfile({
				firstName: profileData.firstName,
				lastName: profileData.lastName,
			});

			logger.authProfileUpdate('Profile completed successfully');
			return profileResponse;
		} catch (error) {
			logger.authError('Profile completion failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Change user password
	 */
	async changePassword(changePasswordData: ChangePasswordData): Promise<string> {
		try {
			logger.authProfileUpdate('Changing user password');

			const response = await apiService.changePassword(changePasswordData);

			logger.authProfileUpdate('Password changed successfully');
			return response;
		} catch (error) {
			logger.authError('Password change failed', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Clear authentication data and all user-specific data
	 */
	private async clearAuthData(): Promise<void> {
		// Clear all auth-related storage keys from localStorage
		await storageService.delete(this.TOKEN_KEY); // 'access_token'
		await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN); // 'refresh_token'

		// Clear all user-specific data from localStorage
		await storageService.delete(CLIENT_STORAGE_KEYS.USER_ID);
		await storageService.delete(CLIENT_STORAGE_KEYS.GAME_PREFERENCES);
		await storageService.delete(CLIENT_STORAGE_KEYS.GAME_STATE);
		await storageService.delete(CLIENT_STORAGE_KEYS.GAME_HISTORY);
		await storageService.delete(CLIENT_STORAGE_KEYS.USER_PREFERENCES);
		await storageService.delete(CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTIES);
		await storageService.delete(CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTY_HISTORY);
		await storageService.delete(CLIENT_STORAGE_KEYS.SCORE_HISTORY);

		// Clear Redux Persist storage manually to avoid non-serializable action
		// persist:user is in sessionStorage (cleared automatically when tab closes)
		// persist:favorites and persist:gameMode are in localStorage
		await storageService.delete('persist:favorites');
		await storageService.delete('persist:gameMode');
		// Note: persist:user is in sessionStorage and will be cleared when tab closes
		// We can't delete from sessionStorage here because storageService only handles localStorage

		// Note: Audio preferences are kept (volume, muted, etc.) as they are user device preferences, not account-specific
		// Session storage (sessionStorage) is automatically cleared when browser tab/window is closed
	}
}

export const authService = new AuthService();
