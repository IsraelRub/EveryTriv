/**
 * User utility functions for EveryTriv client
 * Handles user ID generation and management
 */
import { clientLogger } from 'everytriv-shared/services';
import { generateUserId } from 'everytriv-shared/utils';

import { STORAGE_KEYS } from '../constants';

/**
 * Generate or retrieve user ID from localStorage
 * @returns string User ID
 */
export function getOrCreateClientUserId(): string {
	try {
		let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

		if (!userId) {
			userId = generateUserId();
			localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
		}

		return userId;
	} catch (error) {
		// Fallback if localStorage is not available
		clientLogger.storageWarn('localStorage not available, generating temporary user ID');
		return generateUserId();
	}
}
