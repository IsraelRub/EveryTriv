/**
 * Authentication service for EveryTriv client
 * Handles user authentication, login, logout, and token management
 *
 * @module ClientAuthService
 * @description Client-side authentication service with token management
 * @used_by client/hooks/api/useAuth.ts, client/views/registration/RegistrationView.tsx, client/components/user/OAuthCallback.tsx
 */
import { AuthCredentials, AuthResponse, User } from '@shared';
import { clientLogger } from '@shared';

import { CLIENT_STORAGE_KEYS } from '../../constants';
import { apiService } from '../api';
import { storageService } from '../storage';

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
   * @returns Authentication response with token and user data
   * @throws When authentication fails
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      clientLogger.securityLogin('Attempting to login user', { username: credentials.username });

      const response = await apiService.login(credentials);

      // Store auth data
      await this.setAuthData(response);

      clientLogger.logUserActivity(response.user.id, 'login', { username: credentials.username });
      return response;
    } catch (error) {
      clientLogger.securityDenied('Login failed', { error, username: credentials.username });
      throw error;
    }
  }

  /**
   * Register user account
   * @returns Authentication response after successful registration
   * @throws When registration fails
   */
  async register(credentials: AuthCredentials & { email: string }): Promise<AuthResponse> {
    try {
      clientLogger.authRegister('Attempting to register user', { username: credentials.username });

      const response = await apiService.register(credentials);

      // Store auth data
      await this.setAuthData(response);

      clientLogger.authRegister('User registered successfully', { userId: response.user.id });
      return response;
    } catch (error) {
      clientLogger.errorWithStack(
        error instanceof Error ? error : new Error(String(error)),
        'Registration failed',
        {
          username: credentials.username,
        }
      );
      throw error;
    }
  }

  /**
   * Logout user and clear session
   * @returns Resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      clientLogger.authLogout('Logging out user');

      // Clear auth data
      await this.clearAuthData();

      // Call API logout
      await apiService.logout();

      clientLogger.authLogout('User logged out successfully');
    } catch (error) {
      clientLogger.authError('Logout failed', { error });
      // Clear local data even if API call fails
      await this.clearAuthData();
    }
  }

  /**
   * Get user info
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const user = (await apiService.getCurrentUser()) as User;

      // Update stored user data
      await storageService.set(this.USER_KEY, user);

      return {
        ...user,
        role: user.role || 'user', // Provide default role if not set
      };
    } catch (error) {
      clientLogger.errorWithStack(
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
      clientLogger.authTokenRefresh('Refreshing auth token');

      const response = (await apiService.refreshToken()) as AuthResponse;

      // Update auth data
      await this.setAuthData(response);

      clientLogger.authTokenRefresh('Token refreshed successfully');
      return response;
    } catch (error) {
      clientLogger.errorWithStack(
        error instanceof Error ? error : new Error(String(error)),
        'Token refresh failed'
      );
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    return await apiService.getAuthToken();
  }

  /**
   * Get user from storage
   */
  async getStoredUser(): Promise<AuthResponse['user'] | null> {
    const result = await storageService.get<AuthResponse['user']>(this.USER_KEY);
    return result.success && result.data ? result.data : null;
  }

  /**
   * Get auth state
   */
  async getAuthState(): Promise<{
    isAuthenticated: boolean;
    user: AuthResponse['user'] | null;
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
  private async setAuthData(authResponse: AuthResponse): Promise<void> {
    // Token is already stored by apiService.login() with 'access_token' key
    // Only store user data here to avoid duplication
    await storageService.set(this.USER_KEY, authResponse.user);
  }

  /**
   * Initiate Google OAuth login
   */
  async initiateGoogleLogin(): Promise<void> {
    try {
      clientLogger.securityLogin('Initiating Google OAuth login');

      // Redirect to Google OAuth endpoint
      const googleAuthUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3003'}/auth/google`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      clientLogger.securityDenied('Google login initiation failed', { error });
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
      clientLogger.authProfileUpdate('Completing user profile');

      // Split fullName into firstName and lastName
      const nameParts = profileData.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updatedUser = (await apiService.updateUserProfile({
        first_name: firstName,
        last_name: lastName,
      })) as User;

      // Update stored user data
      await storageService.set(this.USER_KEY, updatedUser);

      clientLogger.authProfileUpdate('Profile completed successfully', { userId: updatedUser.id });
      // Add role property to match AuthResponse user type
      return {
        ...updatedUser,
        role: 'user',
      };
    } catch (error) {
      clientLogger.authError('Profile completion failed', { error });
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
  }): Promise<AuthResponse['user']> {
    try {
      clientLogger.authProfileUpdate('Updating user profile');

      const updatedUser = (await apiService.updateUserProfile(profileData)) as User;

      // Update stored user data
      await storageService.set(this.USER_KEY, updatedUser);

      clientLogger.authProfileUpdate('Profile updated successfully', { userId: updatedUser.id });
      // Add role property to match AuthResponse user type
      return {
        ...updatedUser,
        role: 'user',
      };
    } catch (error) {
      clientLogger.authError('Profile update failed', { error });
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
