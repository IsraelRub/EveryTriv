import type { StorageOperationResult } from '@shared/types';
import { VALIDATORS } from '@shared/validation';

import { AUTH_STORAGE_KEYS, AUTH_TOKEN_CHANGED_EVENT, STORAGE_KEYS, type StorageKey } from '@/constants';

function getStorage(key: StorageKey): Storage {
	return AUTH_STORAGE_KEYS.has(key) ? sessionStorage : localStorage;
}

function createFailResult<T>(data: T | undefined): StorageOperationResult<T> {
	return {
		success: false,
		data,
		timestamp: new Date(),
	};
}

class StorageService {
	async getString(key: StorageKey): Promise<StorageOperationResult<string>> {
		try {
			const item = getStorage(key).getItem(key);
			if (item === null) {
				return createFailResult<string>(undefined);
			}

			const parsed = JSON.parse(item);

			if (VALIDATORS.string(parsed)) {
				return { success: true, data: parsed, timestamp: new Date() };
			}
		} catch {
			// Invalid JSON or storage access denied (private mode, quota, etc.)
		}

		return createFailResult<string>(undefined);
	}

	async setString(key: StorageKey, value: string): Promise<StorageOperationResult<string>> {
		try {
			getStorage(key).setItem(key, JSON.stringify(value));

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
			}

			return { success: true, data: value, timestamp: new Date() };
		} catch {
			// setItem failed (quota, private mode, etc.)
		}

		return createFailResult<string>(undefined);
	}

	async delete(key: StorageKey): Promise<StorageOperationResult<boolean>> {
		try {
			getStorage(key).removeItem(key);

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
			}

			return { success: true, data: true, timestamp: new Date() };
		} catch {
			// removeItem failed
		}

		return createFailResult<boolean>(false);
	}
}

export const storageService = new StorageService();
