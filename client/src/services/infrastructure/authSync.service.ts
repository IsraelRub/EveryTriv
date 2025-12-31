/**
 * Auth Sync Service
 *
 * @module AuthSyncService
 * @description Service for token verification and authentication synchronization
 * @used_by client/src/services/infrastructure/auth.service.ts
 */
import { defaultValidators } from '@shared/constants';
import { hasPropertyOfType, isRecord } from '@shared/utils';
import { CLIENT_STORAGE_KEYS } from '@/constants';
import { storageService } from '@/services';

/**
 * Auth Sync Service
 * Handles token verification and user ID extraction
 */
class AuthSyncService {
	/**
	 * Decode JWT token to extract user ID
	 * @param token JWT token string
	 * @returns User ID from token payload or null if invalid
	 */
	getUserIdFromToken(token: string | null | undefined): string | null {
		if (!token) return null;
		try {
			const tokenParts = token.split('.');
			if (tokenParts.length === 3 && tokenParts[1] != null) {
				const decoded = atob(tokenParts[1]);
				const payload = JSON.parse(decoded);
				if (isRecord(payload) && hasPropertyOfType(payload, 'sub', defaultValidators.string)) {
					return payload.sub;
				}
			}
		} catch {
			// Ignore decode errors
		}
		return null;
	}

	/**
	 * Verify token matches user ID
	 * @param token JWT token string
	 * @param userId User ID to verify against
	 * @returns True if token matches user ID
	 */
	verifyTokenMatchesUser(token: string | null | undefined, userId: string): boolean {
		const tokenUserId = this.getUserIdFromToken(token);
		return tokenUserId === userId;
	}

	/**
	 * Get user ID from stored token
	 * @returns User ID from stored token or null if not found/invalid
	 */
	async getUserIdFromStoredToken(): Promise<string | null> {
		const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
		const token = tokenResult.success ? tokenResult.data : null;
		return this.getUserIdFromToken(token);
	}

	/**
	 * Verify stored token matches user ID
	 * @param userId User ID to verify against
	 * @returns True if stored token matches user ID
	 */
	async verifyStoredTokenMatchesUser(userId: string): Promise<boolean> {
		const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
		const token = tokenResult.success ? tokenResult.data : null;
		return this.verifyTokenMatchesUser(token, userId);
	}
}

export const authSyncService = new AuthSyncService();

