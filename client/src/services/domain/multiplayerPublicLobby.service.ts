import { API_ENDPOINTS, HTTP_CLIENT_CONFIG, type Locale } from '@shared/constants';
import type { PublicWaitingRoomDto } from '@shared/types';
import { getErrorMessage, isPublicWaitingRoomList } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';

const DEFAULT_LIMIT = 30;

export async function fetchPublicWaitingMultiplayerRooms(params: {
	topic: string;

	outputLanguage: Locale;
	limit?: number;
	signal?: AbortSignal;
}): Promise<PublicWaitingRoomDto[]> {
	const limit = params.limit ?? DEFAULT_LIMIT;
	const search = new URLSearchParams();
	const trimmedTopic = params.topic.trim();
	if (trimmedTopic !== '') {
		search.set('q', trimmedTopic);
	}
	search.set('lang', params.outputLanguage);
	search.set('limit', String(limit));
	const url = `${API_ENDPOINTS.MULTIPLAYER.ROOMS_PUBLIC_WAITING}?${search.toString()}`;
	try {
		const response = await apiService.get<unknown>(url, {
			skipAuth: true,
			signal: params.signal,
			timeout: HTTP_CLIENT_CONFIG.TIMEOUT,
		});
		const data = response.data;
		if (!isPublicWaitingRoomList(data)) {
			logger.systemError('Invalid public waiting lobbies response', {});
			throw new Error('Invalid public waiting lobbies response');
		}
		return data;
	} catch (error) {
		logger.gameError('Failed to fetch public waiting multiplayer rooms', {
			errorInfo: { message: getErrorMessage(error) },
		});
		throw error;
	}
}
