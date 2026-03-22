import {
	API_ENDPOINTS,
	ERROR_MESSAGES,
	GameMode,
	Locale,
	QUERY_PARAMS,
	SurpriseScope,
	VALIDATION_COUNT,
} from '@shared/constants';
import type {
	ClearOperationResponse,
	GameDifficulty,
	GameHistoryEntry,
	GameHistoryResponse,
	GameSessionStartResponse,
	SubmitAnswerResult,
	SurprisePickResult,
} from '@shared/types';
import { getErrorMessage, hasProperty, isNonEmptyString } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';
import { validateListQueryParams } from '@/utils';

class GameHistoryService {
	async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
		validateListQueryParams(limit, offset);

		try {
			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) searchParams.append(QUERY_PARAMS.OFFSET, String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<GameHistoryResponse>(API_ENDPOINTS.GAME.HISTORY + query);
			const responseData = response.data;

			// Server returns GameHistoryResponse with games array
			if (hasProperty(responseData, 'games') && Array.isArray(responseData.games)) {
				return responseData.games;
			}

			return [];
		} catch (error) {
			logger.gameError('Failed to get user game history', {
				errorInfo: { message: getErrorMessage(error) },
				limit,
				offset,
			});
			throw error;
		}
	}

	async deleteGameHistory(gameId: string): Promise<string> {
		// Validate game ID
		if (!isNonEmptyString(gameId)) {
			throw new Error(ERROR_MESSAGES.validation.GAME_ID_REQUIRED);
		}

		try {
			logger.userInfo('Deleting game history', { gameId });
			const response = await apiService.delete<string>(API_ENDPOINTS.GAME.HISTORY_BY_ID.replace(':gameId', gameId));
			const result = response.data;
			logger.userInfo('Game history deleted successfully', { message: result });
			return result;
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
			});
			throw error;
		}
	}

	async clearGameHistory(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all game history');
			const response = await apiService.delete<ClearOperationResponse>(API_ENDPOINTS.GAME.HISTORY);
			const result = response.data;
			logger.userInfo('All game history cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to clear game history', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getSurprisePick(scope?: SurpriseScope, locale?: Locale): Promise<SurprisePickResult> {
		try {
			const params = new URLSearchParams();
			if (scope) params.set('scope', scope);
			if (locale) params.set('locale', locale);
			const query = params.toString();
			const url = query ? `${API_ENDPOINTS.GAME.SURPRISE_PICK}?${query}` : API_ENDPOINTS.GAME.SURPRISE_PICK;
			const response = await apiService.get<SurprisePickResult>(url);
			return response.data;
		} catch (error) {
			logger.gameError('Failed to get surprise pick', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async startGameSession(
		gameId: string,
		topic: string,
		difficulty: GameDifficulty,
		gameMode: GameMode,
		outputLanguage?: Locale
	): Promise<GameSessionStartResponse> {
		try {
			const response = await apiService.post<GameSessionStartResponse>(API_ENDPOINTS.GAME.SESSION_START, {
				gameId,
				topic,
				difficulty,
				gameMode,
				...(outputLanguage !== undefined && { outputLanguage }),
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to start game session', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
				topic,
				difficulty,
			});
			throw error;
		}
	}

	async submitAnswerToSession(
		gameId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<SubmitAnswerResult> {
		try {
			// Validate answer value (0 to MAX_ANSWER_COUNT-1)
			const minAnswerIndex = 0;
			const maxAnswerIndex = VALIDATION_COUNT.ANSWER_COUNT.MAX - 1;
			if (typeof answer !== 'number' || isNaN(answer) || answer < minAnswerIndex || answer > maxAnswerIndex) {
				throw new Error(ERROR_MESSAGES.game.INVALID_ANSWER_INDEX(maxAnswerIndex));
			}

			const response = await apiService.post<SubmitAnswerResult>(API_ENDPOINTS.GAME.SESSION_ANSWER, {
				gameId,
				questionId,
				answer,
				timeSpent,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to submit answer to session', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
				questionId,
			});
			throw error;
		}
	}

	async finalizeGameSession(gameId: string): Promise<GameHistoryEntry> {
		try {
			const response = await apiService.post<GameHistoryEntry>(API_ENDPOINTS.GAME.SESSION_FINALIZE, {
				gameId,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to finalize game session', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
			});
			throw error;
		}
	}
}

export const gameHistoryService = new GameHistoryService();
