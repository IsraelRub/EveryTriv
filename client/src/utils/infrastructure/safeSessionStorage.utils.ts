import type { SessionStorageKey } from '@/types';

export function safeSessionStorageGet(key: SessionStorageKey): string | null {
	if (typeof globalThis.sessionStorage === 'undefined') {
		return null;
	}
	try {
		return globalThis.sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

export function safeSessionStorageSet(key: SessionStorageKey, value: string): void {
	if (typeof globalThis.sessionStorage === 'undefined') {
		return;
	}
	try {
		globalThis.sessionStorage.setItem(key, value);
	} catch {
		// sessionStorage may be unavailable (private mode)
	}
}

export function safeSessionStorageRemove(key: SessionStorageKey): void {
	if (typeof globalThis.sessionStorage === 'undefined') {
		return;
	}
	try {
		globalThis.sessionStorage.removeItem(key);
	} catch {
		// ignore
	}
}
