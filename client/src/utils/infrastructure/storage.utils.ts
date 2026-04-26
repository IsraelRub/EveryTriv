import { StorageKeys } from '@/constants';
import type { StorageKey } from '@/types';

export const AUTH_STORAGE_KEYS = new Set<StorageKey>([
	StorageKeys.AUTH_TOKEN,
	StorageKeys.AUTH_USER,
	StorageKeys.REFRESH_TOKEN,
]);

function isMultiplayerSummaryStorageKey(key: string): key is `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${string}` {
	return key.startsWith(StorageKeys.MULTIPLAYER_SUMMARY_PREFIX);
}

function isErrorLogStorageKey(key: string): key is `${StorageKeys.ERROR_LOG}-${string}` {
	return key.startsWith(`${StorageKeys.ERROR_LOG}-`);
}

export function getOrCreateMultiplayerSummaryTabId(): string {
	if (typeof globalThis.sessionStorage === 'undefined') {
		return 'default';
	}
	try {
		const existing = globalThis.sessionStorage.getItem(StorageKeys.MULTIPLAYER_SUMMARY_TAB_ID);
		if (existing != null && existing.length > 0) {
			return existing;
		}
		const id = globalThis.crypto.randomUUID();
		globalThis.sessionStorage.setItem(StorageKeys.MULTIPLAYER_SUMMARY_TAB_ID, id);
		return id;
	} catch {
		return 'default';
	}
}

export function getMultiplayerSummaryStorageKey(roomId: string): `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${string}` {
	const tabId = getOrCreateMultiplayerSummaryTabId();
	const key = `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${roomId}__${tabId}`;
	if (!isMultiplayerSummaryStorageKey(key)) throw new Error('Invalid multiplayer summary key');
	return key;
}

export function getLegacyMultiplayerSummaryStorageKey(
	roomId: string
): `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${string}` {
	const key = `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${roomId}`;
	if (!isMultiplayerSummaryStorageKey(key)) throw new Error('Invalid multiplayer summary key');
	return key;
}

export function getErrorLogStorageKey(featureName: string): `${StorageKeys.ERROR_LOG}-${string}` {
	const key = `${StorageKeys.ERROR_LOG}-${featureName}`;
	if (!isErrorLogStorageKey(key)) throw new Error('Invalid error log key');
	return key;
}
