import { DEFAULT_GAME_CONFIG, EMPTY_VALUE, VALIDATION_LENGTH } from '@shared/constants';
import { extractCustomDifficultyText, isCustomDifficulty, VALIDATORS } from '@shared/validation';

import { isNonEmptyString } from './data.utils';

export function truncateWithEllipsis(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	if (maxLength <= 3) return '...'.slice(0, maxLength);
	return `${str.substring(0, maxLength - 3)}...`;
}

export function formatNumericValue(
	value: number | null | undefined,
	decimals: number = 2,
	suffix?: string,
	prefix?: string
): string {
	const formatted = (value ?? 0).toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
	return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

export function formatCurrency(amountCents: number, currency: string = 'USD'): string {
	const value = amountCents / 100;
	const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`;
}

export function pad2(n: number): string {
	return n.toString().padStart(2, '0');
}

export function formatDate(date: Date | string | null | undefined, defaultValue: string = EMPTY_VALUE): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}
	const d = VALIDATORS.string(date) ? new Date(date) : date;
	return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function capitalize(word: string | null | undefined): string {
	if (!isNonEmptyString(word)) return '';
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatTitle(topic: string | null | undefined): string {
	if (!isNonEmptyString(topic)) return '';
	const t = topic.trim();
	const words = t
		.replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`)
		.toLowerCase()
		.split(/\s+/);
	return words.map(capitalize).join(' ');
}

export function formatDifficulty(
	difficulty: string | null | undefined,
	maxLength: number = VALIDATION_LENGTH.STRING_TRUNCATION.SHORT
): string {
	const value = difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty;
	if (!isCustomDifficulty(value)) {
		return formatTitle(value);
	}
	const customText = extractCustomDifficultyText(value);
	const formatted = formatTitle(customText);
	return truncateWithEllipsis(formatted, maxLength);
}
