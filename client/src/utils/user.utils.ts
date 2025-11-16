/**
 * User Utilities
 *
 * @module UserUtils
 * @description Utility functions for user management and preferences
 */
import { clientLogger as logger } from '@shared/services';
import { generateUserId } from '@shared/utils';

import { CLIENT_STORAGE_KEYS } from '../constants';
import { storageService } from '../services';

/**
 * Generate or retrieve user ID from localStorage
 * @returns string User ID
 */
export async function getOrCreateClientUserId(): Promise<string> {
	try {
		const userIdResult = await storageService.getString(CLIENT_STORAGE_KEYS.USER_ID);
		let userId = userIdResult.success ? userIdResult.data : null;

		if (!userId) {
			userId = generateUserId();
			await storageService.set(CLIENT_STORAGE_KEYS.USER_ID, userId);
		}

		return userId;
	} catch {
		logger.storageWarn('Storage not available, generating temporary user ID');
		return generateUserId();
	}
}
