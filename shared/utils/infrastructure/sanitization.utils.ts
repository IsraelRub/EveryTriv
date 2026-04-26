import { VALIDATION_LENGTH } from '@shared/constants';

export function sanitizeLogMessage(message: string): string {
	return message
		.replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: ***')
		.replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: ***')
		.replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key: ***')
		.replace(/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret: ***');
}

export function sanitizeCardNumber(cardNumber: string): string {
	return cardNumber.replace(/\s/g, '').replace(/\D/g, '');
}

export function sanitizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function sanitizeInput(value: string, maxLength: number = VALIDATION_LENGTH.INPUT.MAX): string {
	const trimmed = value.trim().replace(/\s+/g, ' ');
	const withoutTags = trimmed.replace(/<[^>]*>/g, '');
	return withoutTags.length > maxLength ? withoutTags.slice(0, maxLength) : withoutTags;
}

export function normalizeText(text: string): string {
	return text
		.trim()
		.replace(/\s+/g, ' ') // Replace multiple spaces with single space
		.toLowerCase();
}
