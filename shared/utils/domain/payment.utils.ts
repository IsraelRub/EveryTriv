import { sanitizeCardNumber } from '../infrastructure/sanitization.utils';

const CARD_BRAND_PATTERNS: { name: string; pattern: RegExp }[] = [
	{ name: 'visa', pattern: /^4[0-9]{6,}$/ },
	{ name: 'mastercard', pattern: /^(5[1-5][0-9]{5,}|2(2[2-9][0-9]{4,}|[3-6][0-9]{5,}|7[01][0-9]{4,}|720[0-9]{3,}))$/ },
	{ name: 'amex', pattern: /^3[47][0-9]{5,}$/ },
	{ name: 'discover', pattern: /^6(?:011|5[0-9]{2})[0-9]{3,}$/ },
	{ name: 'diners', pattern: /^3(?:0[0-5]|[68][0-9])[0-9]{4,}$/ },
	{ name: 'jcb', pattern: /^(?:2131|1800|35\d{3})\d{3,}$/ },
];

export function detectCardBrand(rawNumber: string): string {
	const digits = sanitizeCardNumber(rawNumber);
	const brand = CARD_BRAND_PATTERNS.find(entry => entry.pattern.test(digits));
	return brand ? brand.name : 'unknown';
}

export function extractLastFourDigits(rawNumber: string): string {
	const digits = sanitizeCardNumber(rawNumber);
	return digits.slice(-4);
}
