/**
 * Game Configuration Types
 * @module GameConfigTypes
 * @description Game configuration and setup types
 */
import { GameMode } from '@shared/constants';
import type {
	BaseGameTopicDifficulty,
	DifficultyBreakdown,
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
export interface GameConfig extends Pick<GameModeConfig, 'mode' | 'timeLimit' | 'maxQuestionsPerGame'> {
	topic: string;
	difficulty: GameDifficulty;
	answerCount?: number;
	settings?: GameUISettings;
}

/**
 * Game data interface
 * @interface ClientGameData
 * @description Game data and state for client-side game session
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game/Game.tsx
 */
export interface ClientGameData {
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
	currentDifficulty: GameDifficulty;
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
	gameQuestionCount?: number;
	canGoBack?: boolean;
	canGoForward?: boolean;
	isGameComplete?: boolean;
	questions?: TriviaQuestion[];
	answers?: number[];
	data?: ClientGameData;
	config?: GameConfig;
	stats?: ClientGameSessionStats;
	error?: string;
	trivia?: TriviaQuestion;
	selected?: number | null;
	loading?: boolean;
	favorites?: BaseGameTopicDifficulty[];
	gameMode?: GameModeConfig;
	streak?: number;
}

/**
 * Game timer state
 * @used_by client/src/components/game/GameTimer.tsx, client/src/hooks/layers/business/useGameLogic.ts, client/src/types/game/components.types.ts
 */
export type GameTimerState = NonNullable<GameModeConfig['timer']>;

/**
 * Client game session statistics interface
 * @interface ClientGameSessionStats
 * @description Comprehensive game session statistics for client-side game state
 * @used_by client/src/components/stats/ScoringSystem.tsx
 */
export interface ClientGameSessionStats {
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
	stats?: ClientGameSessionStats;
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
	maxQuestionsPerGame: number;
}

/**
 * History item type
 * @interface HistoryItem
 * @description Game history entry for display
 */
export interface HistoryItem {
	topic: string;
	difficulty: GameDifficulty;
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

/**
 * Current question metadata interface
 * @interface CurrentQuestionMetadata
 * @description Metadata for the current question being displayed
 */
export interface CurrentQuestionMetadata {
	customDifficultyMultiplier?: number;
	actualDifficulty?: string;
	gameQuestionCount?: number;
}

/**
 * Leaderboard display entry interface
 * @interface LeaderboardDisplayEntry
 * @description Leaderboard entry for display purposes
 */
export interface LeaderboardDisplayEntry {
	rank: number;
	email: string;
	score: number;
	avatar?: string;
}

/**
 * Leaderboard click entry interface
 * @interface LeaderboardClickEntry
 * @description Leaderboard entry data for click callbacks
 */
export interface LeaderboardClickEntry {
	id: string;
	email: string;
	score: number;
	rank: number;
}

/**
 * Clickable item interface
 * @interface ClickableItem
 * @description Generic clickable item with id, name, and value
 */
export interface ClickableItem {
	id: string;
	name: string;
	value: number;
}

/**
 * Game mode selection config interface
 * @interface GameModeSelectionConfig
 * @description Configuration for game mode selection
 */
export interface GameModeSelectionConfig {
	mode: GameMode;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
}

/**
 * Game mode option interface
 * @interface GameModeOption
 * @description Game mode option configuration for UI selection
 */
export interface GameModeOption {
	id: GameMode;
	name: string;
	description: string;
	icon: import('lucide-react').LucideIcon;
	showQuestionLimit: boolean;
	showTimeLimit: boolean;
}

/**
 * Base game result data interface
 * @interface BaseGameResultData
 * @description Common fields shared between game result interfaces (navigation state and API DTO)
 */
export interface BaseGameResultData {
	score: number;
	gameQuestionCount: number;
	correctAnswers: number;
	timeSpent: number;
	questionsData: import('@shared/types').QuestionData[];
}

/**
 * Game summary navigation state interface
 * @interface GameSummaryNavigationState
 * @description State passed via navigation when navigating to game summary view
 * @used_by client/src/views/game/GameSummaryView.tsx, client/src/views/game/GameSessionView.tsx
 */
export interface GameSummaryNavigationState extends BaseGameResultData {
	topic?: string;
	difficulty?: string;
}

/**
 * Game summary display statistics interface
 * @interface GameSummaryStats
 * @description Formatted statistics for display in game summary view
 * @used_by client/src/views/game/GameSummaryView.tsx
 */
export interface GameSummaryStats {
	score: number;
	correct: number;
	total: number;
	time: string;
	percentage: number;
	topic: string;
	difficulty: string;
	questionsData: import('@shared/types').QuestionData[];
}
