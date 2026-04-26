import { DEFAULT_GAME_CONFIG, GAME_MODES_CONFIG, GameMode, VALIDATION_COUNT } from '@shared/constants';

import type {
	SingleSessionCompletionParams,
	SingleSessionCompletionState,
	SingleSessionCreditDeductionParams,
	SingleSessionExpectedQuestionCountParams,
	SingleSessionGameModeFlags,
	SingleSessionQuestionsPerRequestParams,
} from '@/types';

export function getSingleSessionGameModeFlags(gameMode: GameMode): SingleSessionGameModeFlags {
	const isQuestionLimited = gameMode === GameMode.QUESTION_LIMITED;
	const isTimeLimited = gameMode === GameMode.TIME_LIMITED;
	const isUnlimited = gameMode === GameMode.UNLIMITED;
	const hasQuestionLimit = isQuestionLimited || gameMode === GameMode.MULTIPLAYER;
	return {
		isQuestionLimited,
		isTimeLimited,
		isUnlimited,
		hasQuestionLimit,
	};
}

export function getSingleSessionQuestionsPerRequest(params: SingleSessionQuestionsPerRequestParams): number {
	const { gameMode, maxQuestionsPerGame, gameQuestionCount } = params;
	const flags = getSingleSessionGameModeFlags(gameMode);
	const config = GAME_MODES_CONFIG[gameMode];

	if (flags.hasQuestionLimit) {
		return (
			maxQuestionsPerGame ??
			gameQuestionCount ??
			config?.defaults?.maxQuestionsPerGame ??
			VALIDATION_COUNT.QUESTIONS.MAX
		);
	}
	if (flags.isTimeLimited) {
		return VALIDATION_COUNT.QUESTIONS.INITIAL_BATCH_TIME_LIMITED;
	}
	return maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.UNLIMITED;
}

export function getSingleSessionCreditDeductionValue(params: SingleSessionCreditDeductionParams): number {
	const { gameMode, timeLimit, maxQuestionsPerGame } = params;
	const flags = getSingleSessionGameModeFlags(gameMode);
	const defaultTime = VALIDATION_COUNT.TIME_LIMIT.DEFAULT;

	if (flags.isTimeLimited) {
		return timeLimit ?? defaultTime;
	}
	if (flags.isUnlimited) {
		return 1;
	}
	return (
		maxQuestionsPerGame ?? GAME_MODES_CONFIG[gameMode]?.defaults?.maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.MAX
	);
}

export function getSingleSessionExpectedQuestionCount(
	params: SingleSessionExpectedQuestionCountParams
): number | undefined {
	const { gameMode, gameQuestionCount, maxQuestionsPerGame } = params;
	const flags = getSingleSessionGameModeFlags(gameMode);
	if (!flags.hasQuestionLimit) return undefined;
	const config = GAME_MODES_CONFIG[gameMode];
	return (
		gameQuestionCount ??
		maxQuestionsPerGame ??
		config?.defaults?.maxQuestionsPerGame ??
		DEFAULT_GAME_CONFIG.maxQuestionsPerGame
	);
}

export function getSingleSessionCompletionState(params: SingleSessionCompletionParams): SingleSessionCompletionState {
	const { gameMode, currentQuestionIndex, gameQuestionCount, questionsLength } = params;
	const flags = getSingleSessionGameModeFlags(gameMode);
	const nextQuestionIndex = currentQuestionIndex + 1;
	const questionsExhausted = nextQuestionIndex >= questionsLength;

	const shouldFetchMore = flags.isTimeLimited && questionsExhausted;
	// Time-limited games end only via the session timer (handleGameTimeout), not when the buffer is empty.
	const shouldEndGame = flags.hasQuestionLimit && gameQuestionCount != null && nextQuestionIndex >= gameQuestionCount;

	return { shouldEndGame, shouldFetchMore };
}
