export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
	}).format(amount);
}

export function calculatePricePerCredit(price: number, credits: number): number {
	return parseFloat((price / credits).toFixed(4));
}

export function formatForDisplay(value: number, decimals: number = 2): string {
	return Number(value.toFixed(decimals)).toLocaleString();
}
