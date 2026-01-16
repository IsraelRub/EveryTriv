export function sanitizeInput(input: string, maxLength: number = 1000): string {
	return input
		.trim()
		.replace(/[<>]/g, '') // Remove potential HTML tags
		.substring(0, maxLength);
}

export function sanitizeLogMessage(message: string): string {
	return message
		.replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: ***')
		.replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: ***')
		.replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key: ***')
		.replace(/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret: ***');
}

export function sanitizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function sanitizeCardNumber(cardNumber: string): string {
	return cardNumber.replace(/\s/g, '').replace(/\D/g, '');
}

export function normalizeText(text: string): string {
	return text
		.trim()
		.replace(/\s+/g, ' ') // Replace multiple spaces with single space
		.toLowerCase();
}
