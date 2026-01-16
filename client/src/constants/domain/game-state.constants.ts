import { GAME_STATE_DEFAULTS, GameMode } from '@shared/constants';
import type { GameDifficulty, TriviaQuestion } from '@shared/types';

export enum GameClientStatus {
	IDLE = 'idle',
	LOADING = 'loading',
	PLAYING = 'playing',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	ERROR = 'error',
}

const initialClientState: {
	status: GameClientStatus;
	isPlaying: boolean;
	currentQuestion: number;
	gameQuestionCount: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isGameComplete: boolean;
	questions: TriviaQuestion[];
	answers: number[];
	loading: boolean;
	error: undefined;
	trivia: undefined;
	selected: null;
	streak: number;
} = {
	status: GameClientStatus.IDLE,
	isPlaying: false,
	currentQuestion: 0,
	gameQuestionCount: 0,
	canGoBack: false,
	canGoForward: false,
	isGameComplete: false,
	questions: [],
	answers: [],
	loading: false,
	error: undefined,
	trivia: undefined,
	selected: null,
	streak: 0,
};

const initialGameModeState: {
	currentMode: GameMode;
	currentTopic: string;
	currentDifficulty: GameDifficulty;
	currentSettings: {
		mode: GameMode;
		topic: string;
		difficulty: GameDifficulty;
		maxQuestionsPerGame: number | undefined;
		timeLimit: number | undefined;
		answerCount: number | undefined;
	};
	isLoading: boolean;
	error: string | undefined;
} = {
	currentMode: GameMode.QUESTION_LIMITED,
	currentTopic: GAME_STATE_DEFAULTS.TOPIC,
	currentDifficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
	currentSettings: {
		mode: GameMode.QUESTION_LIMITED,
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
		maxQuestionsPerGame: GAME_STATE_DEFAULTS.TOTAL_QUESTIONS,
		timeLimit: undefined,
		answerCount: undefined,
	},
	isLoading: false,
	error: undefined,
};

export const GAME_STATE_CONFIG = {
	initialClientState,
	initialGameModeState,
} as const;
