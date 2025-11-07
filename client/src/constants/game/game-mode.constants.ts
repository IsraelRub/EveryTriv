/**
 * Game Mode Constants
 * @description Centralized default settings for all game modes
 * @used_by client/src/redux/features, client/src/components/gameMode
 */
import { GameMode } from '@shared/constants';

/**
 * Default question limit for question-limited mode
 */
export const DEFAULT_QUESTION_LIMIT = 10;

/**
 * Unlimited questions indicator (used for unlimited and time-limited modes)
 */
export const UNLIMITED_QUESTIONS = 999;

/**
 * Default time limit for time-limited mode (in seconds)
 */
export const DEFAULT_TIME_LIMIT = 60;

/**
 * Game mode default settings
 * @constant
 * @description Default settings for each game mode, following the same pattern as DIFFICULTY_MULTIPLIERS
 * @used_by client/src/views/home/HomeView.tsx, client/src/components/GameMode.tsx, client/src/redux/slices/gameModeSlice.ts
 */
export const GAME_MODE_DEFAULTS = {
	[GameMode.QUESTION_LIMITED]: {
		timeLimit: 0,
		questionLimit: DEFAULT_QUESTION_LIMIT,
	},
	[GameMode.TIME_LIMITED]: {
		timeLimit: DEFAULT_TIME_LIMIT,
		questionLimit: UNLIMITED_QUESTIONS,
	},
	[GameMode.UNLIMITED]: {
		timeLimit: 0,
		questionLimit: UNLIMITED_QUESTIONS,
	},
} as const;

/**
 * Default game mode
 */
export const DEFAULT_GAME_MODE = GameMode.QUESTION_LIMITED;
