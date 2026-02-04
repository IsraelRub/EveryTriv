import { VALIDATORS } from '@shared/constants';

export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
	}).format(amount);
}

export function calculatePricePerCredit(price: number, credits: number): number {
	return Number((price / credits).toFixed(4));
}

export function formatForDisplay(value: number, decimals: number = 2): string {
	return Number(value.toFixed(decimals)).toLocaleString();
}

function pad2(n: number): string {
	return n.toString().padStart(2, '0');
}

export function formatDate(date: Date | string | null | undefined, defaultValue: string = '-'): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}
	const d = typeof date === 'string' ? new Date(date) : date;
	return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateShort(date: Date | string | null | undefined, defaultValue: string = '-'): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}
	const d = typeof date === 'string' ? new Date(date) : date;
	return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function formatDateTime(date: Date | string | null | undefined, defaultValue: string = '-'): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}
	const d = typeof date === 'string' ? new Date(date) : date;
	const datePart = formatDate(d, defaultValue);
	if (datePart === defaultValue) return defaultValue;
	return `${datePart} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
