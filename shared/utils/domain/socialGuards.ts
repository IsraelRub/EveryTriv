import { VALIDATORS } from '@shared/constants';

import { isRecord } from '../core/data.utils';

export function isSocialLinkItem(value: unknown): value is {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: unknown;
} {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.name) &&
		VALIDATORS.string(value.url) &&
		VALIDATORS.string(value.hoverColor) &&
		VALIDATORS.string(value.shareColor) &&
		(value.icon === undefined || VALIDATORS.function(value.icon))
	);
}

export function isSocialSharePlatform(value: unknown): value is {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	getShareUrl: (text: string, url: string) => string;
} {
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
