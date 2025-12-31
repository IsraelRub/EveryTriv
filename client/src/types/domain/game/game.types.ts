/**
 * Game Configuration Types
 * @module GameConfigTypes
 * @description Game configuration and setup types
 */
import type { LucideIcon } from 'lucide-react';

import { DifficultyLevel, GameClientStatus, GameMode, type GameMode as GameModeType } from '@shared/constants';
import type {
	BaseGameTopicDifficulty,
	BaseTriviaParams,
	CountRecord,
	DifficultyBreakdown,
	GameData,
	GameDifficulty,
	GameModeConfig,
	QuestionData,
	TriviaAnswer,
	TriviaQuestion,
} from '@shared/types';

/**
 * Custom game settings interface
 * @interface CustomSettings
 * @description Custom game configuration settings
 * @used_by client/src/views/game/CustomDifficultyView.tsx
 */
export interface CustomSettings {
	questionCount: number;
	timePerQuestion: number;
	difficultyValue: number;
}

/**
 * Game configuration interface
 * @interface GameConfig
 * @description Game configuration and setup
 * Extends BaseTriviaParams with game mode specific settings
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig
	extends BaseTriviaParams,
		Pick<GameModeConfig, 'mode' | 'timeLimit' | 'maxQuestionsPerGame'> {
	settings?: {
		showTimer?: boolean;
		showProgress?: boolean;
		allowBackNavigation?: boolean;
	};
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
 * Game mode state interface
 * @interface GameModeState
 * @description Game mode state for Redux
 * @used_by client/src/redux/features/gameModeSlice.ts
 * @see GAME_STATE_CONFIG.initialGameModeState for default initial state
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
 * @see GAME_STATE_CONFIG.initialClientState for default initial state
 */
export interface ClientGameState {
	status: GameClientStatus;
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
	topicsPlayed?: CountRecord;
	successRateByDifficulty?: DifficultyBreakdown;
	questionsAnswered: number;
	correctAnswers: number;
	totalGames: number;
	timeElapsed?: number;
}

/**
 * Game mode option interface
 * @interface GameModeOption
 * @description Game mode option configuration for UI selection
 */
export interface GameModeOption {
	name: string;
	description: string;
	icon: LucideIcon;
	showQuestionLimit: boolean;
	showTimeLimit: boolean;
}

/**
 * Game summary navigation state interface
 * @interface GameSummaryNavigationState
 * @description State passed via navigation when navigating to game summary view
 * Extends GameData with navigation-specific requirements (userId is required)
 * @used_by client/src/views/game/GameSummaryView.tsx, client/src/views/game/GameSessionView.tsx
 */
export interface GameSummaryNavigationState
	extends Omit<GameData, 'userId' | 'gameMode' | 'creditsUsed' | 'topic' | 'difficulty'> {
	userId: string; // Required for navigation
	topic?: string; // Optional override (GameData has required topic)
	difficulty?: GameDifficulty; // Optional override (GameData has required difficulty)
	gameMode?: GameData['gameMode']; // Optional override
	creditsUsed?: number; // Optional override
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
	difficulty: GameDifficulty;
	questionsData: QuestionData[];
}

/**
 * Deduct credits mutation parameters
 * @interface DeductCreditsParams
 * @description Parameters for deducting credits mutation
 * @used_by client/src/hooks/useCredits.ts
 */
export interface DeductCreditsParams {
	questionsPerRequest: number;
	gameMode?: GameModeType;
}

/**
 * Game settings form props interface
 * @interface GameSettingsFormProps
 * @description Props for the GameSettingsForm component
 * @used_by client/src/components/game/GameSettingsForm.tsx
 */
export interface GameSettingsFormProps {
	topic: string;
	onTopicChange: (topic: string) => void;
	selectedDifficulty: DifficultyLevel;
	onDifficultyChange: (difficulty: DifficultyLevel) => void;
	customDifficulty: string;
	onCustomDifficultyChange: (customDifficulty: string) => void;
	customDifficultyError: string;
	onCustomDifficultyErrorChange: (error: string) => void;
	answerCount: number;
	onAnswerCountChange: (count: number) => void;
	selectedMode?: GameMode;
	maxQuestionsPerGame?: number;
	onMaxQuestionsPerGameChange?: (count: number) => void;
	timeLimit?: number;
	onTimeLimitChange?: (limit: number) => void;
	maxPlayers?: number;
	onMaxPlayersChange?: (count: number) => void;
	showMaxPlayers?: boolean;
}
