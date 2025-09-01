/**
 * טיפוסי משחק בצד הלקוח
 * הגדרות ישויות/מצבים של משחק ורכיבי משחק ללקוח
 *
 * @module ClientGameTypes
 * @used_by client/src/views/**, client/src/components/game/**, client/src/redux/**, client/src/hooks/layers/business/**
 */
import { DifficultyLevel } from 'everytriv-shared/constants';
import { GameMode } from 'everytriv-shared/constants/game.constants';
import { TriviaQuestion } from 'everytriv-shared/types';
import { FormEvent } from 'react';

// Achievement Types
/**
 * הישגי משתמש במשחק
 * @used_by client/src/components/stats/Achievements.tsx
 */
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
	category: string;
	points: number;
}

// Client-specific types that extend shared types
/**
 * פרופס לרכיב נושאים מועדפים
 * @used_by client/src/components/user/FavoriteTopics.tsx
 */
export interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
	className?: string;
}

// Game configuration types
/**
 * קונפיגורציית משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig {
	mode: GameMode;
	difficulty: string;
	topic: string;
	questionCount: number;
	timeLimit?: number;
	questionLimit?: number;
}

// Game Data Types
/**
 * נתוני משחק בסיסיים
 * @used_by client/src/services/api/api.service.ts (getGameById), client/src/views/**
 */
export interface GameData {
	questions: TriviaQuestion[];
	totalQuestions: number;
	difficulty: string;
	topic: string;
}

// Game mode configuration
/**
 * מטען שינוי מצב משחק (payload)
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeConfigPayload {
	mode: GameMode;
	config?: {
		timeLimit?: number;
		questionLimit?: number;
	};
}

/**
 * מצב Redux של מצב המשחק
 * @used_by client/src/redux/features/gameModeSlice.ts, client/src/types/redux.types.ts
 */
export interface GameModeState {
	currentMode: GameMode;
	availableModes: GameMode[];
	loading: boolean;
	error: string | null;
	timeRemaining?: number;
}

// Game navigation types
/**
 * מצב ניווט בין שאלות
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameNavigationState {
	currentQuestionIndex: number;
	totalQuestions: number;
	canGoNext: boolean;
	canGoPrevious: boolean;
}

// Game state types
/**
 * מצב משחק כולל
 * @used_by client/src/views/home/HomeView.tsx, client/src/redux/features/gameSlice.ts
 */
export interface GameState {
	isPlaying: boolean;
	currentQuestion: number;
	totalQuestions: number;
	score: number;
	timeRemaining: number;
	difficulty: string;
	topic: string;
	questions: TriviaQuestion[];
	answers: TriviaAnswer[];
	loading: boolean;
	error: string | null;
	// Additional properties for game state
	trivia: TriviaQuestion | null;
	selected: number | null;
	total: number;
	stats: {
		topicsPlayed: Record<string, number>;
		successRateByDifficulty: Record<string, { correct: number; total: number }>;
		totalGames: number;
		difficultyStats: Record<string, { correct: number; total: number }>;
	};
	gameMode: {
		mode: GameMode;
		isGameOver: boolean;
		timer: {
			isRunning: boolean;
			startTime: number | null;
			timeElapsed: number;
		};
		questionsRemaining?: number;
		timeLimit?: number;
		questionLimit?: number;
		timeRemaining?: number;
	};
	streak: number;
	favorites: Array<{ topic: string; difficulty: string }>;
}

// Game timer types
/**
 * מצב טיימר משחק
 * @used_by client/src/components/game/GameTimer.tsx
 */
export interface GameTimerState {
	isRunning: boolean;
	timeElapsed: number;
	timeRemaining: number;
	startTime: number | null;
}

// GameModeConfig is already defined above, no need to import

export interface GameProps {
	trivia: TriviaQuestion;
	selected: number | null;
	onAnswer: (index: number) => Promise<void>;
	onNewQuestion: () => Promise<void>;
	gameMode: GameModeConfig;
	onGameEnd?: () => void;
}

export interface GameTimerProps {
	timeRemaining: number;
	isRunning: boolean;
	timeElapsed: number;
	isGameOver: boolean;
	mode: GameMode;
	onTimeUp?: () => void;
	className?: string;
}

export interface QuestionCountOption {
	value: number;
	label: string;
}

export interface TriviaAnswer {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface TriviaFormProps {
	topic: string;
	difficulty: string;
	questionCount: QuestionCountOption;
	onTopicChange: (topic: string) => void;
	onDifficultyChange: (difficulty: DifficultyLevel) => void;
	onQuestionCountChange: (count: QuestionCountOption) => void;
	onSubmit: (e: FormEvent) => void;
	onGameModeSelect?: (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => void;
	showGameModeSelector?: boolean;
	onGameModeSelectorClose?: () => void;
	loading?: boolean;
	error?: string;
}

export interface TriviaGameProps {
	questions?: TriviaQuestion[];
	trivia: TriviaQuestion;
	selected: number | null;
	onAnswer: (questionIndex: number, answerIndex: number) => void;
	onNewQuestion: () => Promise<void>;
	onComplete: (score: number) => void;
	onGameEnd?: () => void;
	gameMode: GameModeConfig;
}

/**
 * סטטיסטיקות משחק בזמן אמת
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionStats {
	questionsAnswered: number;
	correctAnswers: number;
	timeElapsed: number;
	score: number;
}

/**
 * נתוני סשן משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionData {
	lastGameMode: GameMode | null;
	lastScore: number;
	lastTimeElapsed: number;
	sessionCount: number;
}

/**
 * עדכון סטטיסטיקות משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameStatsUpdate {
	questionsAnswered?: number;
	correctAnswers?: number;
	timeElapsed?: number;
	score?: number;
}

/**
 * עדכון נתוני סשן משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionUpdate {
	lastGameMode?: GameMode | null;
	lastScore?: number;
	lastTimeElapsed?: number;
	sessionCount?: number;
}

/**
 * קונפיגורציית מצב משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameModeConfig {
	mode: GameMode;
	timeLimit?: number;
	questionLimit?: number;
}

/**
 * עדכון מצב משחק
 * @used_by client/src/views/home/HomeView.tsx
 */
export interface GameStateUpdate {
	isPlaying?: boolean;
	currentQuestion?: number;
	totalQuestions?: number;
	score?: number;
	timeRemaining?: number;
	difficulty?: string;
	topic?: string;
	questions?: TriviaQuestion[];
	answers?: TriviaAnswer[];
	loading?: boolean;
	error?: string | null;
	trivia?: TriviaQuestion | null;
	selected?: number | null;
	total?: number;
	stats?: Partial<{
		topicsPlayed: Record<string, number>;
		successRateByDifficulty: Record<string, { correct: number; total: number }>;
		totalGames: number;
		difficultyStats: Record<string, { correct: number; total: number }>;
	}>;
	gameMode?: {
		mode?: GameMode;
		isGameOver?: boolean;
		timer?: {
			isRunning?: boolean;
			startTime?: number | null;
			timeElapsed?: number;
		};
		questionsRemaining?: number;
		timeLimit?: number;
		questionLimit?: number;
		timeRemaining?: number;
	};
	streak?: number;
	favorites?: Array<{ topic: string; difficulty: string }>;
}
