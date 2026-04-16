export function getDocumentDirection(): 'rtl' | 'ltr' | undefined {
	if (typeof document === 'undefined') return undefined;
	const raw = document.documentElement.getAttribute('dir');
	if (raw === 'rtl' || raw === 'ltr') {
		return raw;
	}
	return undefined;
}
