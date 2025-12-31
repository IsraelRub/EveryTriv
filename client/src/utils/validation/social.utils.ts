/**
 * Social Validation Utilities
 *
 * @module SocialValidationUtils
 * @description Type guards for social-related types
 * @used_by client/src/components/layout/Footer.tsx, client/src/components/social/SocialShare.tsx
 */

import { defaultValidators } from '@shared/constants';
import { isRecord } from '@shared/utils';
import type { SocialLinkItem, SocialPlatformData, SocialSharePlatform } from '@/types';

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
		defaultValidators.string(value.name) &&
		defaultValidators.string(value.url) &&
		defaultValidators.string(value.hoverColor) &&
		defaultValidators.string(value.shareColor) &&
		(value.icon === undefined || typeof value.icon === 'function')
	);
}

/**
 * Type guard for SocialSharePlatform
 * @param value Value to check
 * @returns True if value is a valid SocialSharePlatform with getShareUrl function
 */
export function isSocialSharePlatform(value: unknown): value is SocialSharePlatform {
	if (!isRecord(value)) {
		return false;
	}

	return (
		defaultValidators.string(value.name) &&
		defaultValidators.string(value.url) &&
		defaultValidators.string(value.hoverColor) &&
		defaultValidators.string(value.shareColor) &&
		typeof value.getShareUrl === 'function'
	);
}

/**
 * Type guard for SocialPlatformData
 * @param value Value to check
 * @returns True if value is a valid SocialPlatformData
 */
export function isSocialPlatformData(value: unknown): value is SocialPlatformData {
	if (!isRecord(value)) {
		return false;
	}

	return (
		defaultValidators.string(value.name) &&
		defaultValidators.string(value.url) &&
		defaultValidators.string(value.hoverColor) &&
		defaultValidators.string(value.shareColor) &&
		(value.getShareUrl === undefined || typeof value.getShareUrl === 'function')
	);
}
