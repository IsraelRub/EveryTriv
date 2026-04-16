import { isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import type { SocialLinkItem, SocialSharePlatform } from '../../types/ui/social.types';

export function isSocialLinkItem(value: unknown): value is SocialLinkItem {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.name) &&
		VALIDATORS.string(value.url) &&
		VALIDATORS.string(value.hoverColor) &&
		(value.icon === undefined || VALIDATORS.function(value.icon))
	);
}

export function isSocialSharePlatform(value: unknown): value is SocialSharePlatform {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.name) &&
		VALIDATORS.string(value.url) &&
		VALIDATORS.string(value.hoverColor) &&
		VALIDATORS.string(value.shareColor) &&
		VALIDATORS.function(value.getShareUrl)
	);
}
