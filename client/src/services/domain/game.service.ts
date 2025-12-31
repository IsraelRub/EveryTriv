/**
 * Game service for EveryTriv client
 * Handles trivia game operations, question generation, and answer submission
 *
 * @module ClientGameService
 * @description Client-side game and trivia management
 * @used_by client/src/hooks/useTrivia.ts, client/src/views/game, client/src/components
 */
import { API_ROUTES } from '@shared/constants';
import type {
	BaseValidationResult,
	ClearOperationResponse,
	CustomDifficultyRequest,
	TriviaRequest,
	TriviaResponse,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { apiService, clientLogger as logger } from '@/services';
import type { AllTriviaQuestionsResponse, GameStatistics } from '@/types';

/**
 * Main game service class
 * @class ClientGameService
 * @description Handles all game-related operations for the client
 * @used_by client/src/hooks/useTrivia.ts, client/src/views/game
 */
class ClientGameService {
	/**
	 * Get trivia questions
	 * @param request Trivia request parameters
	 * @returns Trivia response with questions
	 * @throws {Error} When retrieval fails
	 */
	async getTrivia(request: TriviaRequest): Promise<TriviaResponse> {
		try {
			const apiResponse = await apiService.post<TriviaResponse>(API_ROUTES.GAME.TRIVIA, request);
			return apiResponse.data;
		} catch (error) {
			logger.gameError('Failed to get trivia questions', {
				error: getErrorMessage(error),
				topic: request.topic,
				difficulty: request.difficulty,
			});
			throw error;
		}
	}

	/**
	 * Validate custom difficulty text
	 * @param customText Custom difficulty description
	 * @returns Validation result
	 * @throws {Error} When validation fails
	 */
	async validateCustomDifficulty(customText: string): Promise<BaseValidationResult> {
		try {
			// Server-side validation handles all checks via CustomDifficultyPipe
			const request: CustomDifficultyRequest = { customText };
			const apiResponse = await apiService.post<BaseValidationResult>(API_ROUTES.GAME.VALIDATE_CUSTOM, request);
			return apiResponse.data;
		} catch (error) {
			logger.gameError('Failed to validate custom difficulty', {
				error: getErrorMessage(error),
				customText,
			});
			throw error;
		}
	}

	/**
	 * Get game statistics (Admin only)
	 * @returns Game statistics
	 * @throws {Error} When retrieval fails
	 */
	async getGameStatistics(): Promise<GameStatistics> {
		try {
			logger.gameInfo('Fetching game statistics');
			const response = await apiService.get<GameStatistics>(API_ROUTES.GAME.ADMIN.STATISTICS);
			const result = response.data;
			logger.gameInfo('Game statistics fetched successfully');
			return result;
		} catch (error) {
			logger.gameError('Failed to get game statistics', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Clear all game history (Admin only)
	 * @returns Clear operation result
	 * @throws {Error} When operation fails
	 */
	async clearAllGameHistory(): Promise<ClearOperationResponse> {
		try {
			logger.gameInfo('Clearing all game history');
			const response = await apiService.delete<ClearOperationResponse>(API_ROUTES.GAME.ADMIN.HISTORY_CLEAR_ALL);
			const result = response.data;
			logger.gameInfo('All game history cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to clear all game history', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get all trivia questions (Admin only)
	 * @returns All trivia questions
	 * @throws {Error} When retrieval fails
	 */
	async getAllTriviaQuestions(): Promise<AllTriviaQuestionsResponse> {
		try {
			logger.gameInfo('Fetching all trivia questions');
			const response = await apiService.get<AllTriviaQuestionsResponse>(API_ROUTES.GAME.ADMIN.TRIVIA);
			const result = response.data;
			logger.gameInfo('All trivia questions fetched successfully', { count: result.totalCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Clear all trivia questions (Admin only)
	 * @returns Clear operation result
	 * @throws {Error} When operation fails
	 */
	async clearAllTrivia(): Promise<ClearOperationResponse> {
		try {
			logger.gameInfo('Clearing all trivia questions');
			const response = await apiService.delete<ClearOperationResponse>(API_ROUTES.GAME.ADMIN.TRIVIA_CLEAR_ALL);
			const result = response.data;
			logger.gameInfo('All trivia questions cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.gameError('Failed to clear all trivia questions', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const gameService = new ClientGameService();
