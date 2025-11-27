/**
 * Game Configuration Types
 * @module GameConfigTypes
 * @description Game configuration and setup types
 */
import { DifficultyLevel, GameMode } from '@shared/constants';
import type {
	DifficultyBreakdown,
	FavoriteTopic,
	GameDifficulty,
	GameModeConfig,
	TopicsPlayed,
	TriviaAnswer,
	TriviaQuestion,
} from '@shared/types';

/**
 * Game UI settings interface
 * @interface GameUISettings
 * @description UI-specific settings for game display and interaction
 */
export interface GameUISettings {
	showTimer?: boolean;
	showProgress?: boolean;
	allowBackNavigation?: boolean;
}

/**
 * Game configuration interface
 * @interface GameConfig
 * @description Game configuration and setup
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig extends Pick<GameModeConfig, 'mode' | 'timeLimit' | 'questionLimit'> {
	topic: string;
	difficulty: GameDifficulty;
	settings?: GameUISettings;
}

/**
 * Game data interface
 * @interface GameData
 * @description Game data and state
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game/Game.tsx
 */
export interface GameData {
	questions: TriviaQuestion[];
	answers: TriviaAnswer[];
	score: number;
	currentQuestionIndex: number;
	startTime: Date;
	endTime?: Date;
}

/**
 * Game mode configuration payload interface
 * @interface GameModeConfigPayload
 * @description Game mode configuration payload for Redux - alias for GameConfig
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export type GameModeConfigPayload = GameConfig;

/**
 * Game mode state interface
 * @interface GameModeState
 * @description Game mode state for Redux
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeState {
	currentMode: GameMode;
	currentTopic: string;
	currentDifficulty: DifficultyLevel;
	currentSettings: GameConfig;
	isLoading: boolean;
	error?: string;
}

/**
 * Game state interface
 * @interface ClientGameState
 * @description Game state for Redux and hooks
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/redux/features/gameSlice.ts
 */
export interface ClientGameState {
	status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
	isPlaying?: boolean;
	currentQuestion?: number;
	totalQuestions?: number;
	canGoBack?: boolean;
	canGoForward?: boolean;
	isGameComplete?: boolean;
	questions?: TriviaQuestion[];
	answers?: number[];
	data?: GameData;
	config?: GameConfig;
	stats?: GameSessionStats;
	error?: string;
	trivia?: TriviaQuestion;
	selected?: number | null;
	loading?: boolean;
	favorites?: FavoriteTopic[];
	gameMode?: GameModeConfig;
	streak?: number;
}

/**
 * Game timer state
 * @used_by client/src/components/game/GameTimer.tsx, client/src/hooks/layers/business/useGameLogic.ts, client/src/types/game/components.types.ts
 */
export type GameTimerState = NonNullable<GameModeConfig['timer']>;

/**
 * Game session statistics
 * @used_by client/src/components/stats/ScoringSystem.tsx
 */
export interface GameSessionStats {
	currentScore: number;
	maxScore: number;
	successRate: number;
	averageTimePerQuestion: number;
	correctStreak: number;
	maxStreak: number;
	topicsPlayed?: TopicsPlayed;
	successRateByDifficulty?: DifficultyBreakdown;
	questionsAnswered: number;
	correctAnswers: number;
	totalGames: number;
	timeElapsed?: number;
}

/**
 * Game session data
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionData {
	sessionId?: string;
	startTime?: Date;
	endTime?: Date;
	duration?: number;
	stats?: GameSessionStats;
	results?: TriviaAnswer[];
	lastGameMode: GameMode | null;
	sessionCount: number;
	lastScore?: number;
	lastTimeElapsed?: number;
}

/**
 * Game mode default settings
 * @used_by client/src/constants/gameModeDefaults.ts, client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeDefaults {
	timeLimit?: number;
	questionLimit: number;
}

/**
 * Requested questions option type
 * @interface RequestedQuestionsOption
 * @description Option for selecting number of questions requested
 */
export interface RequestedQuestionsOption {
	value: number;
	label: string;
}

/**
 * History item type
 * @interface HistoryItem
 * @description Game history entry for display
 */
export interface HistoryItem {
	topic: string;
	difficulty: string;
	score: number;
	date: string;
	timestamp?: number;
}

/**
 * Score stats type
 * @interface ScoreStats
 * @description Score statistics for display
 */
export interface ScoreStats {
	min: number;
	grade: string;
	color: string;
}
