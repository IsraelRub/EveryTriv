import { defaultValidators } from '@shared/constants';
import type { BasicUser } from '@shared/types';

/**
 * User Utilities
 *
 * @module UserUtils
 * @description Utility functions for user-related operations
 */

/**
 * Get user initials from first name, last name, or email
 * @param firstName User's first name (optional)
 * @param lastName User's last name (optional)
 * @param email User's email (optional)
 * @returns User initials (2 letters if both names exist, 1 letter otherwise)
 * @description
 * - If both firstName and lastName exist: returns first letter of firstName + first letter of lastName
 * - If only firstName exists: returns first letter of firstName
 * - Otherwise: returns first letter of email or 'U' as fallback
 */
export const getUserInitials = (
	firstName?: string | null,
	lastName?: string | null,
	email?: string | null
): string => {
	if (firstName && lastName) {
		return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
	}
	if (firstName) {
		return firstName.charAt(0).toUpperCase();
	}
	if (email) {
		return email.charAt(0).toUpperCase();
	}
	return 'U';
};

/**
 * Check if Redux user has missing profile fields compared to server user
 * @param reduxUser User from Redux state
 * @param serverUser User from server query
 * @returns True if server user has fields that Redux user is missing
 */
export const hasMissingProfileFields = (reduxUser: BasicUser | null, serverUser: BasicUser | null): boolean => {
	if (!reduxUser || !serverUser) {
		return false;
	}

	const hasNameGap =
		(!!serverUser.firstName && !reduxUser.firstName) || (!!serverUser.lastName && !reduxUser.lastName);
	const serverHasAvatar = defaultValidators.number(serverUser.avatar);
	const reduxHasAvatar = defaultValidators.number(reduxUser.avatar);
	const hasAvatarGap = serverHasAvatar && !reduxHasAvatar;

	return hasNameGap || hasAvatarGap;
};

