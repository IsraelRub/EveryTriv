import { API_ENDPOINTS, HTTP_TIMEOUTS, Locale, ValidateTextContext, VALIDATION_COUNT } from '@shared/constants';
import type {
	AdminGameStatistics,
	GameDifficulty,
	GameSessionValidationResponse,
	LanguageValidationResult,
	TriviaResponse,
} from '@shared/types';
import { getErrorMessage, hasProperty, isRecord } from '@shared/utils';

import type { TriviaQuestionsResponse, TriviaRequestWithSignal } from '@/types';
import { apiService, clientLogger as logger } from '@/services';

class GameService {
	async getTrivia(request: TriviaRequestWithSignal): Promise<TriviaResponse> {
		try {
			const { signal, ...triviaRequest } = request;
			const apiResponse = await apiService.post<TriviaResponse>(API_ENDPOINTS.GAME.TRIVIA, triviaRequest, {
				signal,
				timeout: HTTP_TIMEOUTS.TRIVIA_CLIENT,
				skipDeduplication: true,
			});
			return apiResponse.data;
		} catch (error) {
			const message = getErrorMessage(error);
			const isAbortError =
				message === 'Request was cancelled' ||
				message.includes('aborted') ||
				message === 'signal is aborted without reason' ||
				(isRecord(error) &&
					'statusCode' in error &&
					error.statusCode === 0 &&
					hasProperty(error, 'details') &&
					isRecord(error.details) &&
					error.details.error === 'Request was cancelled');
			if (!isAbortError) {
				logger.gameError('Failed to get trivia questions', {
					errorInfo: { message },
					topic: request.topic,
					difficulty: request.difficulty,
				});
			}
			throw error;
		}
	}

	async validateTriviaTopic(params: {
		topic: string;
		difficulty: GameDifficulty;
		outputLanguage: Locale;
	}): Promise<{ ok: true }> {
		try {
			const apiResponse = await apiService.post<{ ok: true }>(API_ENDPOINTS.GAME.VALIDATE_TRIVIA_TOPIC, params);
			return apiResponse.data;
		} catch (error) {
			logger.gameError('Failed to validate trivia topic', {
				errorInfo: { message: getErrorMessage(error) },
				topic: params.topic,
				difficulty: params.difficulty,
			});
			throw error;
		}
	}

	async validateText(
		text: string,
		context?: ValidateTextContext,
		language?: Locale
	): Promise<LanguageValidationResult> {
		try {
			const apiResponse = await apiService.post<LanguageValidationResult>(API_ENDPOINTS.GAME.VALIDATE_TEXT, {
				text: text.trim(),
				...(context && { context }),
				...(language && { language }),
			});
			return apiResponse.data;
		} catch (error) {
			logger.userError('Failed to validate text', {
				errorInfo: { message: getErrorMessage(error) },
				validateTextContext: context,
			});
			throw error;
		}
	}

	async getGameStatistics(): Promise<AdminGameStatistics> {
		try {
			logger.userInfo('Fetching game statistics');
			const response = await apiService.get<AdminGameStatistics>(API_ENDPOINTS.ADMIN.STATISTICS);
			const result = response.data;
			logger.userInfo('Game statistics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get game statistics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getAllTriviaQuestions(params?: { limit?: number; offset?: number }): Promise<TriviaQuestionsResponse> {
		try {
			const limit = params?.limit ?? VALIDATION_COUNT.ADMIN_TRIVIA_LIST.DEFAULT_LIMIT;
			const offset = params?.offset ?? 0;
			const query = new URLSearchParams({ limit: String(limit), offset: String(offset) }).toString();
			logger.gameInfo('Fetching trivia questions (admin)', { limit, offset });
			const response = await apiService.get<TriviaQuestionsResponse>(`${API_ENDPOINTS.ADMIN.TRIVIA}?${query}`);
			const result = response.data;
			logger.gameInfo('All trivia questions fetched successfully', { count: result.totalCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async validateSession(gameId: string): Promise<GameSessionValidationResponse> {
		try {
			const url = API_ENDPOINTS.GAME.VALIDATE_SESSION.replace(':gameId', gameId);
			const response = await apiService.get<GameSessionValidationResponse>(url);
			return response.data;
		} catch (error) {
			logger.gameError('Failed to validate game session', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
			});
			// Return invalid session if validation fails
			return { isValid: false };
		}
	}
}

export const gameService = new GameService();
