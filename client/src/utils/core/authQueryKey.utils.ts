import { QUERY_KEYS, STORAGE_KEYS } from '@/constants';

export function readAuthTokenSnapshotForQueryKey(): string | null {
	try {
		return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
	} catch {
		return null;
	}
}

export function getAuthCurrentUserQueryKey(tokenSnapshot?: string | null): readonly string[] {
	const token = tokenSnapshot !== undefined ? tokenSnapshot : readAuthTokenSnapshotForQueryKey();
	return [...QUERY_KEYS.auth.currentUser(), token ?? 'no-token'] as const;
}
