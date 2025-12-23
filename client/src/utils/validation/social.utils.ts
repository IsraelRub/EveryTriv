/**
 * Social Validation Utilities
 *
 * @module SocialValidationUtils
 * @description Type guards for social-related types
 * @used_by client/src/components/layout/Footer.tsx
 */

import { isRecord } from '@shared/utils';

import type { SocialLinkItem } from '@/types';

/**
 * Type guard for SocialLinkItem
 * @param value Value to check
 * @returns True if value is a valid SocialLinkItem
 */
export function isSocialLinkItem(value: unknown): value is SocialLinkItem {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.name === 'string' &&
		typeof value.url === 'string' &&
		typeof value.hoverColor === 'string' &&
		typeof value.shareColor === 'string' &&
		(value.iconName === undefined || typeof value.iconName === 'string')
	);
}
