/**
 * Game state constants and defaults for EveryTriv client
 * Contains default game states, favorite topics, and game configuration constants
 *
 * @module GameStateConstants
 * @description Game state configuration and default values
 * @used_by client/src/views/home/HomeView.tsx, client/src/components/game/**
 */
import { GAME_STATE_DEFAULTS, GameMode, VALIDATION_DEBOUNCE_DELAYS } from '@shared/constants';

import type { ClientGameState } from '../../types';

// Default game state configuration
export const DEFAULT_GAME_STATE: ClientGameState = {
	status: 'idle',
	isPlaying: false,
	currentQuestion: GAME_STATE_DEFAULTS.QUESTION_INDEX,
	totalQuestions: GAME_STATE_DEFAULTS.TOTAL_QUESTIONS,
	questions: [],
	answers: [],
	loading: false,
	error: undefined,
	trivia: undefined,
	selected: null,
	streak: GAME_STATE_DEFAULTS.STREAK,
	favorites: [],
	gameMode: {
		mode: GameMode.UNLIMITED,
		timeLimit: undefined,
		questionLimit: undefined,
		isGameOver: false,
		timer: {
			isRunning: false,
			startTime: null,
			timeElapsed: 0,
		},
	},
	stats: {
		currentScore: 0,
		maxScore: 0,
		successRate: 0,
		averageTimePerQuestion: 0,
		correctStreak: 0,
		maxStreak: 0,
		topicsPlayed: {},
		successRateByDifficulty: {},
		questionsAnswered: 0,
		correctAnswers: 0,
		totalGames: 0,
	},
} as const;

// Game state update configurations
export const GAME_STATE_UPDATES = {
	// Animation delays for UI updates
	ANIMATION_DELAYS: {
		ANSWER_FEEDBACK: 2000, // 2 seconds
		PARTICLE_BURST: 2000, // 2 seconds
		SCORE_UPDATE: 500, // 0.5 seconds
	},

	// Particle effect configurations
	PARTICLE_EFFECTS: {
		CORRECT_ANSWER: {
			count: 15,
			colors: ['#22c55e', '#16a34a', '#15803d'],
			life: 2000,
		},
		INCORRECT_ANSWER: {
			count: 8,
			colors: ['#ef4444', '#dc2626', '#b91c1c'],
			life: 1500,
		},
	},

	// Validation configurations
	VALIDATION: {
		DEBOUNCE_MS: VALIDATION_DEBOUNCE_DELAYS.STANDARD,
		ENABLE_LANGUAGE_VALIDATION: true,
		AUTO_VALIDATE: true,
	},
} as const;
