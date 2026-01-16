import { API_ENDPOINTS } from '@shared/constants';
import type {
	AdminGameStatistics,
	BaseValidationResult,
	ClearOperationResponse,
	CustomDifficultyRequest,
	TriviaRequest,
	TriviaResponse,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';
import type { TriviaQuestionsResponse } from '@/types';

class GameService {
	async getTrivia(request: TriviaRequest): Promise<TriviaResponse> {
		try {
			const apiResponse = await apiService.post<TriviaResponse>(API_ENDPOINTS.GAME.TRIVIA, request);
			return apiResponse.data;
		} catch (error) {
			logger.gameError('Failed to get trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
				topic: request.topic,
				difficulty: request.difficulty,
			});
			throw error;
		}
	}

	async validateCustomDifficulty(customText: string): Promise<BaseValidationResult> {
		try {
			// Server-side validation handles all checks via CustomDifficultyPipe
			const request: CustomDifficultyRequest = { customText };
			const apiResponse = await apiService.post<BaseValidationResult>(API_ENDPOINTS.GAME.VALIDATE_CUSTOM, request);
			return apiResponse.data;
		} catch (error) {
			logger.userError('Failed to validate custom difficulty', {
				errorInfo: { message: getErrorMessage(error) },
				customText,
			});
			throw error;
		}
	}

	async getGameStatistics(): Promise<AdminGameStatistics> {
		try {
			logger.userInfo('Fetching game statistics');
			const response = await apiService.get<AdminGameStatistics>(API_ENDPOINTS.GAME.ADMIN.STATISTICS);
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

	async clearAllGameHistory(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all game history');
			const response = await apiService.delete<ClearOperationResponse>(API_ENDPOINTS.GAME.ADMIN.HISTORY_CLEAR_ALL);
			const result = response.data;
			logger.userInfo('All game history cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.userError('Failed to clear all game history', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getAllTriviaQuestions(): Promise<TriviaQuestionsResponse> {
		try {
			logger.gameInfo('Fetching all trivia questions');
			const response = await apiService.get<TriviaQuestionsResponse>(API_ENDPOINTS.GAME.ADMIN.TRIVIA);
			const result = response.data;
			logger.gameInfo('All trivia questions fetched successfully', { count: result.totalCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async clearAllTrivia(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all trivia questions');
			const response = await apiService.delete<ClearOperationResponse>(API_ENDPOINTS.GAME.ADMIN.TRIVIA_CLEAR_ALL);
			const result = response.data;
			logger.userInfo('All trivia questions cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.userError('Failed to clear all trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async validateSession(gameId: string): Promise<{ isValid: boolean; session?: unknown }> {
		try {
			const url = API_ENDPOINTS.GAME.VALIDATE_SESSION.replace(':gameId', gameId);
			const response = await apiService.get<{ isValid: boolean; session?: unknown }>(url);
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
