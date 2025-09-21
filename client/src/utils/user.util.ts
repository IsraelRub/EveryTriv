/**
 * User Utility Functions
 *
 * @module UserUtils
 * @description Utility functions for user management and operations
 * @used_by client/src/components/user, client/src/hooks/layers/business
 */
import { clientLogger } from '@shared';
import { generateUserId } from '@shared';

import { STORAGE_KEYS } from '../constants';
import { storageService } from '../services';

/**
 * Generate or retrieve user ID from localStorage
 * @returns string User ID
 */
export async function getOrCreateClientUserId(): Promise<string> {
  try {
    const userIdResult = await storageService.get<string>(STORAGE_KEYS.USER_ID);
    let userId = userIdResult.success ? userIdResult.data : null;

    if (!userId) {
      userId = generateUserId();
      await storageService.set(STORAGE_KEYS.USER_ID, userId);
    }

    return userId!;
  } catch (error) {
    clientLogger.storageWarn('Storage not available, generating temporary user ID');
    return generateUserId();
  }
}
