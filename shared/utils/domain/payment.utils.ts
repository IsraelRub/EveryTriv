/**
 * Payment / credits catalog helpers (package SKUs, PayPal product naming).
 *
 * Distinct from `infrastructure/id.utils` `generatePaymentIntentId`, which builds ephemeral
 * client-side payment intent placeholders (`pi_` prefix). Here: stable package SKUs and PayPal catalog ids.
 */

/** PayPal catalog id derived from package SKU (unique per row even if credits collide). */
export function buildPaypalProductIdForCreditPackage(packageId: string): string {
	const safe = packageId.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `everytriv_pkg_${safe}`;
}

/**
 * Generates a new unique package id for admin-created rows.
 * Safe in browser and Node (uses `crypto.randomUUID` when available).
 */
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
