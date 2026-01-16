import {
	API_ENDPOINTS,
	ERROR_MESSAGES,
	GameMode,
	QUERY_PARAMS,
	VALID_GAME_MODES_SET,
	VALIDATION_COUNT,
} from '@shared/constants';
import type {
	AnswerResult,
	ClearOperationResponse,
	GameData,
	GameDifficulty,
	GameHistoryEntry,
	GameHistoryResponse,
} from '@shared/types';
import { getErrorMessage, hasProperty, isNonEmptyString, normalizeGameData } from '@shared/utils';
import { isValidDifficulty, toDifficultyLevel } from '@shared/validation';

import { GAME_STATE_DEFAULTS, VALIDATION_MESSAGES } from '@/constants';
import { apiService, clientLogger as logger } from '@/services';

class GameHistoryService {
	async saveGameResult(gameData: GameData): Promise<GameHistoryEntry> {
		try {
			if (!isNonEmptyString(gameData.userId)) {
				throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED_FOR_HISTORY);
			}
			const userId = gameData.userId;

			if (!isValidDifficulty(gameData.difficulty)) {
				throw new Error(ERROR_MESSAGES.validation.INVALID_DIFFICULTY_LEVEL(gameData.difficulty));
			}
			if (!VALID_GAME_MODES_SET.has(gameData.gameMode)) {
				throw new Error(ERROR_MESSAGES.validation.INVALID_GAME_MODE(gameData.gameMode));
			}

			const createGameHistoryDto = normalizeGameData(gameData, {
				userId,
				topic: GAME_STATE_DEFAULTS.TOPIC,
			});
			await apiService.post<void>(API_ENDPOINTS.GAME.HISTORY, createGameHistoryDto);

			// Create a GameHistoryEntry since saveGameHistory returns void
			const gameHistory: GameHistoryEntry = {
				id: `game_${Date.now()}`,
				createdAt: new Date(),
				updatedAt: new Date(),
				topic: gameData.topic || GAME_STATE_DEFAULTS.TOPIC,
				difficulty: toDifficultyLevel(gameData.difficulty),
				gameMode: gameData.gameMode,
				score: gameData.score,
				gameQuestionCount: gameData.gameQuestionCount,
				correctAnswers: gameData.correctAnswers,
				timeSpent: gameData.timeSpent ?? 0,
				creditsUsed: gameData.creditsUsed ?? 0,
				questionsData: gameData.questionsData ?? [],
				userId,
			};

			return gameHistory;
		} catch (error) {
			logger.gameError('Failed to save game result', {
				errorInfo: { message: getErrorMessage(error) },
				gameData,
			});
			throw error;
		}
	}

	async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
		try {
			// Validate pagination parameters
			if (limit && (limit < 1 || limit > 1000)) {
				throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(1, 1000));
			}
			if (offset && offset < 0) {
				throw new Error(VALIDATION_MESSAGES.OFFSET_NON_NEGATIVE);
			}

			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) searchParams.append(QUERY_PARAMS.OFFSET, String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<GameHistoryResponse>(`${API_ENDPOINTS.GAME.HISTORY}${query}`);
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

	async startGameSession(
		gameId: string,
		topic: string,
		difficulty: GameDifficulty,
		gameMode: GameMode
	): Promise<{ gameId: string; status: string }> {
		try {
			const response = await apiService.post<{ gameId: string; status: string }>(API_ENDPOINTS.GAME.SESSION_START, {
				gameId,
				topic,
				difficulty,
				gameMode,
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
	): Promise<AnswerResult & { sessionScore: number }> {
		try {
			// Validate answer value (0 to MAX_ANSWER_COUNT-1)
			const maxAnswerIndex = VALIDATION_COUNT.ANSWER_COUNT.MAX - 1;
			if (typeof answer !== 'number' || isNaN(answer) || answer < 0 || answer > maxAnswerIndex) {
				throw new Error(`Invalid answer value: must be a number between 0 and ${maxAnswerIndex}`);
			}

			const response = await apiService.post<AnswerResult & { sessionScore: number }>(
				API_ENDPOINTS.GAME.SESSION_ANSWER,
				{
					gameId,
					questionId,
					answer,
					timeSpent,
				}
			);
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
