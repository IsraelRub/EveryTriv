import { API_ENDPOINTS, ERROR_MESSAGES, UserRole } from '@shared/constants';
import type {
	AuthCredentials,
	AuthenticationResult,
	BasicUser,
	ChangePasswordData,
	UserProfileResponseType,
} from '@shared/types';
import { ensureErrorObject, getErrorMessage } from '@shared/utils';

import { EXPECTED_ERROR_CODES, STORAGE_KEYS } from '@/constants';
import { ApiConfig, apiService, clientLogger as logger, storageService, userService } from '@/services';
import type { AuthState } from '@/types';

class AuthService {
	private readonly TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
	private readonly logoutCallbacks: Set<() => void> = new Set();

	async login(credentials: AuthCredentials): Promise<AuthenticationResult> {
		try {
			logger.securityLogin('Attempting to login user', { emails: { current: credentials.email } });

			const response = await apiService.login(credentials);

			// Store auth data
			await this.setAuthData(response);

			if (response.user) {
				logger.logUserActivity(response.user.id, 'login', { emails: { current: credentials.email } });
			}
			return response;
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const isExpectedError = EXPECTED_ERROR_CODES.has(errorMessage);

			if (isExpectedError) {
				// שגיאה צפויה - רק לוג, ללא טואסט
				logger.authDebug('Login failed (expected error)', {
					errorInfo: { message: errorMessage },
					emails: { current: credentials.email },
				});
			} else {
				// שגיאה לא צפויה - עם טואסט
				logger.authError('Login failed (unexpected error)', {
					errorInfo: { message: errorMessage },
					emails: { current: credentials.email },
				});
			}
			throw error;
		}
	}

	async register(
		credentials: AuthCredentials & { firstName?: string; lastName?: string }
	): Promise<AuthenticationResult> {
		try {
			logger.authRegister('Attempting to register user', { emails: { current: credentials.email } });

			const response = await apiService.register(credentials);

			// Store auth data
			await this.setAuthData(response);

			if (response.user) {
				logger.authRegister('User registered successfully', { userId: response.user.id });
			}
			return response;
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const isExpectedError = EXPECTED_ERROR_CODES.has(errorMessage);

			if (isExpectedError) {
				// שגיאה צפויה - רק לוג, ללא טואסט
				logger.authDebug('Registration failed (expected error)', {
					errorInfo: { message: errorMessage },
					emails: { current: credentials.email },
				});
			} else {
				// שגיאה לא צפויה - עם טואסט
				logger.authError(ensureErrorObject(error), {
					contextMessage: 'Registration failed (unexpected error)',
					emails: { current: credentials.email },
				});
			}
			throw error;
		}
	}

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
			logger.authError(ensureErrorObject(error), {
				contextMessage: 'Logout failed',
			});
			// Clear local data even if API call fails
			await this.clearAuthData();
		}
	}

	async getCurrentUser(): Promise<BasicUser> {
		try {
			// Get current token for logging
			const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
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
				tokenLength: token?.length ?? 0,
				userIds: {
					token: tokenUserId,
				},
				emails: {
					token: tokenEmail,
				},
			});

			const user = await apiService.getCurrentUser();

			logger.authInfo('Current user received from server', {
				userId: user.id,
				emails: { current: user.email },
				userType: user.role,
				tokenMatches: tokenUserId === user.id,
				userIds: {
					token: tokenUserId,
					server: user.id,
				},
			});

			// Note: User data is stored in sessionStorage via Redux Persist, not in localStorage
			// Redux state will be updated by the calling hook/component

			return {
				...user,
				role: user.role ?? UserRole.USER, // Provide default role if not set
			};
		} catch (error) {
			logger.authError(ensureErrorObject(error), {
				contextMessage: 'Failed to get current user',
			});
			throw error;
		}
	}

	async refreshToken(): Promise<AuthenticationResult> {
		try {
			logger.authTokenRefresh('Refreshing auth token');

			const response = await apiService.refreshToken();

			// Get existing refresh token from storage
			const refreshTokenResult = await storageService.getString(STORAGE_KEYS.REFRESH_TOKEN);
			const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
			if (!refreshToken) {
				throw new Error(ERROR_MESSAGES.api.NO_REFRESH_TOKEN_AVAILABLE);
			}

			const fullResponse: AuthenticationResult = {
				// User data is managed by React Query, not needed here
				accessToken: response.accessToken,
				refreshToken,
			};

			// Note: User data is managed by React Query (useCurrentUser hook)
			// Token is already stored by apiService.refreshToken()
			// Avoid calling getCurrentUser() here to prevent infinite refresh loop

			logger.authTokenRefresh('Token refreshed successfully');
			return fullResponse;
		} catch (error) {
			logger.authError(ensureErrorObject(error), {
				contextMessage: 'Token refresh failed',
			});
			await this.clearAuthData();
			throw error;
		}
	}

	async isAuthenticated(): Promise<boolean> {
		return await apiService.isAuthenticated();
	}

	async getToken(): Promise<string | null> {
		return await apiService.getAuthToken();
	}

	async getAuthState(): Promise<AuthState> {
		const token = await this.getToken();

		return {
			isAuthenticated: !!token,
			token,
		};
	}

	private async setAuthData(authResponse: AuthenticationResult): Promise<void> {
		// Token is already stored by apiService.register/login() with 'access_token' key
		// User data is stored in sessionStorage via Redux Persist by the calling hook/component
		// No need to store user data here to avoid duplication
		if (authResponse.user) {
			logger.authInfo('Authentication data ready - user will be stored in Redux/sessionStorage', {
				userId: authResponse.user.id,
				emails: { current: authResponse.user.email },
			});
		}
	}

	async waitForTokenStorage(maxAttempts: number = 10, delayMs: number = 50): Promise<boolean> {
		let attempts = 0;
		while (attempts < maxAttempts) {
			const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
			if (tokenResult.success && !!tokenResult.data) {
				return true;
			}
			await new Promise(resolve => setTimeout(resolve, delayMs));
			attempts++;
		}
		return false;
	}

	async verifyStoredTokenForUser(userId: string): Promise<boolean> {
		const { authSyncService } = await import('@/services');
		return authSyncService.verifyStoredTokenMatchesUser(userId);
	}

	registerLogoutCallback(callback: () => void): () => void {
		this.logoutCallbacks.add(callback);
		return () => {
			this.logoutCallbacks.delete(callback);
		};
	}

	async initiateGoogleLogin(): Promise<void> {
		try {
			logger.securityLogin('Initiating Google OAuth login');

			// Redirect to Google OAuth endpoint
			const googleAuthUrl = `${ApiConfig.getBaseUrl()}${API_ENDPOINTS.AUTH.GOOGLE}`;

			logger.authInfo('Redirecting to Google OAuth', {
				url: googleAuthUrl,
			});

			window.location.href = googleAuthUrl;
		} catch (error) {
			logger.securityDenied('Google login initiation failed', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

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
			logger.authError('Profile completion failed', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async changePassword(changePasswordData: ChangePasswordData): Promise<string> {
		try {
			logger.authProfileUpdate('Changing user password');

			const response = await apiService.changePassword(changePasswordData);

			logger.authProfileUpdate('Password changed successfully');
			return response;
		} catch (error) {
			logger.authError('Password change failed', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	private async clearAuthData(): Promise<void> {
		// Clear all auth-related storage keys from localStorage
		await storageService.delete(this.TOKEN_KEY); // 'access_token'
		await storageService.delete(STORAGE_KEYS.REFRESH_TOKEN); // 'refresh_token'

		// Clear all user-specific data from localStorage
		await storageService.delete(STORAGE_KEYS.USER_ID);
		await storageService.delete(STORAGE_KEYS.GAME_PREFERENCES);
		await storageService.delete(STORAGE_KEYS.GAME_STATE);
		await storageService.delete(STORAGE_KEYS.GAME_HISTORY);
		await storageService.delete(STORAGE_KEYS.USER_PREFERENCES);
		await storageService.delete(STORAGE_KEYS.CUSTOM_DIFFICULTIES);
		await storageService.delete(STORAGE_KEYS.CUSTOM_DIFFICULTY_HISTORY);
		await storageService.delete(STORAGE_KEYS.SCORE_HISTORY);

		// Clear Redux Persist storage manually to avoid non-serializable action
		// persist:user is in sessionStorage (cleared automatically when tab closes)
		// persist:gameMode is in localStorage
		await storageService.delete('persist:gameMode');
		// Clear other Redux Persist storage
		await storageService.delete('persist:audioSettings');
		await storageService.delete('persist:uiPreferences');
		// Note: persist:user is in sessionStorage and will be cleared when tab closes
		// We can't delete from sessionStorage here because storageService only handles localStorage

		// Trigger logout callbacks (e.g., Redux state resets)
		// This decouples AuthService from Redux store while allowing hooks/services to register cleanup callbacks
		this.logoutCallbacks.forEach(callback => {
			try {
				callback();
			} catch (error) {
				logger.authError('Error in logout callback', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}
		});
		// Note: Audio preferences are kept (volume, muted, etc.) as they are user device preferences, not account-specific
		// Session storage (sessionStorage) is automatically cleared when browser tab/window is closed
	}
}

export const authService = new AuthService();
