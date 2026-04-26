import { QUERY_KEYS, StorageKeys } from '@/constants';
import { safeSessionStorageGet } from '../infrastructure/safeSessionStorage.utils';

export function readAuthTokenSnapshotForQueryKey(): string | null {
	return safeSessionStorageGet(StorageKeys.AUTH_TOKEN);
}

export function getAuthCurrentUserQueryKey(tokenSnapshot?: string | null): readonly string[] {
	const token = tokenSnapshot !== undefined ? tokenSnapshot : readAuthTokenSnapshotForQueryKey();
	return [...QUERY_KEYS.auth.currentUser(), token ?? 'no-token'] as const;
}
