import { EMPTY_VALUE } from '@shared/constants';
import { extractCustomDifficultyText, isCustomDifficulty, VALIDATORS } from '@shared/validation';

export function formatNumericValue(
	value: number | null | undefined,
	decimals: number = 2,
	suffix?: string,
	prefix?: string
): string {
	const n = value ?? 0;
	const formatted = n.toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
	return (prefix ?? '') + formatted + (suffix ?? '');
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
	if (word == null || word.trim().length === 0) return '';
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatTitle(topic: string | null | undefined): string {
	if (!topic?.trim()) return '';
	const words = topic
		.trim()
		.replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`)
		.toLowerCase()
		.split(/\s+/);
	return words.map(capitalize).join(' ');
}

export function formatDifficulty(difficulty: string, maxLength: number = 50): string {
	if (!isCustomDifficulty(difficulty)) {
		return formatTitle(difficulty);
	}
	const customText = extractCustomDifficultyText(difficulty);
	const formatted = formatTitle(customText);
	if (formatted.length <= maxLength) {
		return formatted;
	}
	return formatted.substring(0, maxLength - 3) + '...';
}
