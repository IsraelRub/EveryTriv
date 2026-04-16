export function buildPaypalProductIdForCreditPackage(packageId: string): string {
	const safe = packageId.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `everytriv_pkg_${safe}`;
}

export function generateCreditPackageId(): string {
	const idPart =
		typeof globalThis !== 'undefined' &&
		'crypto' in globalThis &&
		globalThis.crypto != null &&
		typeof globalThis.crypto.randomUUID === 'function'
			? globalThis.crypto.randomUUID().replace(/-/g, '')
			: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
	return `cpkg_${idPart}`;
}
