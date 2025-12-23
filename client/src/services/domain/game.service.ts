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
	AnswerResult,
	BaseValidationResult,
	ClearOperationResponse,
	CustomDifficultyRequest,
	GameHistoryEntry,
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
			logger.gameInfo('Getting trivia questions', {
				topic: request.topic,
				difficulty: request.difficulty,
				questionsPerRequest: request.questionsPerRequest,
			});

			const apiResponse = await apiService.post<TriviaResponse>(API_ROUTES.GAME.TRIVIA, request);
			const response = apiResponse.data;

			logger.gameInfo('Trivia questions retrieved successfully', {
				gameQuestionCount: response.questions?.length || 0,
			});
			return response;
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
	 * Get trivia question by ID
	 * @param id Question identifier
	 * @returns Trivia question details
	 * @throws {Error} When retrieval fails
	 */
	async getQuestionById(id: string): Promise<unknown> {
		try {
			logger.gameInfo('Getting trivia question by ID', { questionId: id });

			const response = await apiService.get<unknown>(API_ROUTES.GAME.TRIVIA_BY_ID.replace(':id', id));

			logger.gameInfo('Trivia question retrieved successfully', { questionId: id });
			return response.data;
		} catch (error) {
			logger.gameError('Failed to get trivia question by ID', {
				error: getErrorMessage(error),
				questionId: id,
			});
			throw error;
		}
	}

	/**
	 * Submit answer to a trivia question
	 * @param questionId Question identifier
	 * @param answer Answer text
	 * @param timeSpent Time spent in seconds (default: 0)
	 * @returns Answer result with correctness
	 * @throws {Error} When submission fails
	 */
	async submitAnswer(questionId: string, answer: string, timeSpent: number = 0): Promise<AnswerResult> {
		// Validate input
		if (!questionId || questionId.trim().length === 0) {
			throw new Error('Question ID is required');
		}
		if (!answer || answer.trim().length === 0) {
			throw new Error('Answer is required');
		}
		if (timeSpent < 0) {
			throw new Error('Time spent must be non-negative');
		}

		try {
			logger.gameInfo('Submitting answer', { questionId, timeSpent });

			const apiResponse = await apiService.post<AnswerResult>(API_ROUTES.GAME.ANSWER, {
				questionId,
				answer,
				timeSpent,
			});
			const result = apiResponse.data;

			logger.gameInfo('Answer submitted successfully', {
				questionId,
				isCorrect: result.isCorrect,
			});
			return result;
		} catch (error) {
			logger.gameError('Failed to submit answer', {
				error: getErrorMessage(error),
				questionId,
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
			logger.gameInfo('Validating custom difficulty', { customText });

			// Server-side validation handles all checks via CustomDifficultyPipe
			const request: CustomDifficultyRequest = { customText };
			const apiResponse = await apiService.post<BaseValidationResult>(API_ROUTES.GAME.VALIDATE_CUSTOM, request);
			const result = apiResponse.data;

			logger.gameInfo('Custom difficulty validated', {
				isValid: result.isValid,
			});
			return result;
		} catch (error) {
			logger.gameError('Failed to validate custom difficulty', {
				error: getErrorMessage(error),
				customText,
			});
			throw error;
		}
	}

	/**
	 * Get game by ID
	 * @param gameId Game identifier
	 * @returns Game history entry
	 * @throws {Error} When retrieval fails
	 */
	async getGameById(gameId: string): Promise<GameHistoryEntry> {
		// Validate game ID
		if (!gameId || gameId.trim().length === 0) {
			throw new Error('Game ID is required');
		}

		try {
			logger.gameInfo('Getting game by ID', { gameId });

			const apiResponse = await apiService.get<GameHistoryEntry>(API_ROUTES.GAME.BY_ID.replace(':id', gameId));
			const game = apiResponse.data;

			logger.gameInfo('Game retrieved successfully', { gameId });
			return game;
		} catch (error) {
			logger.gameError('Failed to get game by ID', {
				error: getErrorMessage(error),
				gameId,
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
			logger.gameInfo('Getting game statistics');

			const response = await apiService.get<GameStatistics>(API_ROUTES.GAME.ADMIN.STATISTICS);

			logger.gameInfo('Game statistics retrieved successfully', {
				totalGames: response.data.totalGames,
			});
			return response.data;
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

			logger.gameInfo('All game history cleared successfully', {
				deletedCount: response.data.deletedCount,
			});
			return response.data;
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
			logger.gameInfo('Getting all trivia questions');

			const response = await apiService.get<AllTriviaQuestionsResponse>(API_ROUTES.GAME.ADMIN.TRIVIA);

			logger.gameInfo('All trivia questions retrieved successfully', {
				totalItems: response.data.totalCount,
			});
			return response.data;
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

			logger.gameInfo('All trivia questions cleared successfully', {
				deletedCount: response.data.deletedCount,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to clear all trivia questions', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const gameService = new ClientGameService();
