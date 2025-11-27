/**
 * Multiplayer Event Helpers
 *
 * @module MultiplayerEventHelpers
 * @description Type-safe helper functions for creating multiplayer game events
 * @used_by server/src/features/game/multiplayer/multiplayer.gateway.ts
 */
import type {
	AnswerReceivedEvent,
	GameEndedEvent,
	GameStartedEvent,
	LeaderboardUpdateEvent,
	Player,
	PlayerJoinedEvent,
	PlayerLeftEvent,
	QuestionEndedEvent,
	QuestionStartedEvent,
	RoomConfig,
	TriviaQuestion,
} from '@shared/types';

/**
 * Create a player joined event
 */
export function createPlayerJoinedEvent(roomId: string, player: Player, players: Player[]): PlayerJoinedEvent {
	return {
		type: 'player-joined',
		roomId,
		timestamp: new Date(),
		data: {
			player,
			players,
		},
	};
}

/**
 * Create a player left event
 */
export function createPlayerLeftEvent(roomId: string, userId: string, players: Player[]): PlayerLeftEvent {
	return {
		type: 'player-left',
		roomId,
		timestamp: new Date(),
		data: {
			userId,
			players,
		},
	};
}

/**
 * Create a game started event
 */
export function createGameStartedEvent(
	roomId: string,
	questions: TriviaQuestion[],
	config: RoomConfig
): GameStartedEvent {
	return {
		type: 'game-started',
		roomId,
		timestamp: new Date(),
		data: {
			questions,
			config,
		},
	};
}

/**
 * Create a question started event
 */
export function createQuestionStartedEvent(
	roomId: string,
	question: TriviaQuestion,
	questionIndex: number,
	timeLimit: number
): QuestionStartedEvent {
	return {
		type: 'question-started',
		roomId,
		timestamp: new Date(),
		data: {
			question,
			questionIndex,
			timeLimit,
		},
	};
}

/**
 * Create an answer received event
 */
export function createAnswerReceivedEvent(
	roomId: string,
	userId: string,
	questionId: string,
	isCorrect: boolean,
	scoreEarned: number,
	leaderboard: Player[]
): AnswerReceivedEvent {
	return {
		type: 'answer-received',
		roomId,
		timestamp: new Date(),
		data: {
			userId,
			questionId,
			isCorrect,
			scoreEarned,
			leaderboard,
		},
	};
}

/**
 * Create a leaderboard update event
 */
export function createLeaderboardUpdateEvent(roomId: string, leaderboard: Player[]): LeaderboardUpdateEvent {
	return {
		type: 'leaderboard-update',
		roomId,
		timestamp: new Date(),
		data: {
			leaderboard,
		},
	};
}

/**
 * Create a question ended event
 */
export function createQuestionEndedEvent(
	roomId: string,
	questionId: string,
	correctAnswer: number,
	results: Array<{
		userId: string;
		isCorrect: boolean;
		scoreEarned: number;
	}>,
	leaderboard: Player[]
): QuestionEndedEvent {
	return {
		type: 'question-ended',
		roomId,
		timestamp: new Date(),
		data: {
			questionId,
			correctAnswer,
			results,
			leaderboard,
		},
	};
}

/**
 * Create a game ended event
 */
export function createGameEndedEvent(
	roomId: string,
	finalLeaderboard: Player[],
	winner: Player | null,
	gameDuration: number
): GameEndedEvent {
	return {
		type: 'game-ended',
		roomId,
		timestamp: new Date(),
		data: {
			finalLeaderboard,
			winner,
			gameDuration,
		},
	};
}
