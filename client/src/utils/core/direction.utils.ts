import { Locale } from '@shared/constants';

export function getDocumentDirection(): 'rtl' | 'ltr' | undefined {
	if (typeof document === 'undefined') return undefined;
	const raw = document.documentElement.getAttribute('dir');
	if (raw === 'rtl' || raw === 'ltr') {
		return raw;
	}
	return undefined;
}

export function setDocumentLocaleFromAppLocale(locale: Locale): void {
	if (typeof document === 'undefined') return;
	document.documentElement.dir = locale === Locale.HE ? 'rtl' : 'ltr';
	document.documentElement.lang = locale;
}
