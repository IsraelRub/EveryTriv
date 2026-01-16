import { VALIDATORS } from '@shared/constants';
import { hasPropertyOfType, isRecord } from '@shared/utils';

import { STORAGE_KEYS } from '@/constants';
import { storageService } from '@/services';

class AuthSyncService {
	getUserIdFromToken(token: string | null | undefined): string | null {
		if (!token) return null;
		try {
			const tokenParts = token.split('.');
			if (tokenParts.length === 3 && tokenParts[1] != null) {
				const decoded = atob(tokenParts[1]);
				const payload = JSON.parse(decoded);
				if (isRecord(payload) && hasPropertyOfType(payload, 'sub', VALIDATORS.string)) {
					return payload.sub;
				}
			}
		} catch {
			// Ignore decode errors
		}
		return null;
	}

	verifyTokenMatchesUser(token: string | null | undefined, userId: string): boolean {
		const tokenUserId = this.getUserIdFromToken(token);
		return tokenUserId === userId;
	}

	async getUserIdFromStoredToken(): Promise<string | null> {
		const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
		const token = tokenResult.success ? tokenResult.data : null;
		return this.getUserIdFromToken(token);
	}

	async verifyStoredTokenMatchesUser(userId: string): Promise<boolean> {
		const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
		const token = tokenResult.success ? tokenResult.data : null;
		return this.verifyTokenMatchesUser(token, userId);
	}
}

export const authSyncService = new AuthSyncService();
