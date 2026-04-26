import { PurchaseCurrency } from '@shared/constants';

export function getDefaultPurchaseCurrencyFromLanguageTag(languageTag: string): PurchaseCurrency {
	const normalized = languageTag.trim().toLowerCase();
	return normalized.startsWith('he') ? PurchaseCurrency.ILS : PurchaseCurrency.USD;
}

export function formatPriceForPurchaseCurrency(currency: PurchaseCurrency, priceUsd: number, priceIls: number): string {
	if (currency === PurchaseCurrency.ILS && Number.isFinite(priceIls) && priceIls > 0) {
		return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(priceIls);
	}
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceUsd);
}

export function formatPricePerCreditForCurrency(
	currency: PurchaseCurrency,
	priceUsd: number,
	priceIls: number,
	credits: number
): string {
	if (!Number.isFinite(credits) || credits <= 0) {
		return currency === PurchaseCurrency.ILS ? '₪0.00' : '$0.00';
	}
	const perUsd = priceUsd / credits;
	const perIls = priceIls / credits;
	if (currency === PurchaseCurrency.ILS && Number.isFinite(priceIls) && priceIls > 0) {
		return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(perIls);
	}
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(perUsd);
}
