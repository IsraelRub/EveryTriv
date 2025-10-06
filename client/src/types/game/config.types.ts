/**
 * Game Configuration Types
 * @module GameConfigTypes
 * @description Game configuration and setup types
 */
import {
  DifficultyLevel,
  GameMode,
  TriviaQuestion,
  GameModeConfig as SharedGameModeConfig,
  TriviaAnswer,
} from '@shared';

/**
 * Game configuration interface
 * @interface GameConfig
 * @description Game configuration and setup
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig
  extends Pick<SharedGameModeConfig, 'mode' | 'timeLimit' | 'questionLimit'> {
  topic: string;
  difficulty: DifficultyLevel;
  settings?: {
    showTimer?: boolean;
    showProgress?: boolean;
    allowBackNavigation?: boolean;
  };
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
 * @description Game mode configuration payload for Redux
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeConfigPayload {
  mode: GameMode;
  topic: string;
  difficulty: DifficultyLevel;
  timeLimit?: number;
  questionLimit?: number;
  config?: Record<string, unknown>;
}

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
  currentSettings: GameModeConfigPayload;
  isLoading: boolean;
  error?: string;
}

/**
 * Game navigation state interface
 * @interface GameNavigationState
 * @description Game navigation state
 * @used_by client/src/components/game/Game.tsx, client/src/views/game/GameView.tsx
 */
export interface GameNavigationState {
  currentQuestion: number;
  totalQuestions: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isGameComplete: boolean;
}

/**
 * Game state interface
 * @interface GameState
 * @description Game state for Redux and hooks
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/redux/features/gameSlice.ts
 */
export interface GameState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  isPlaying?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  timeRemaining?: number;
  difficulty?: string;
  topic?: string;
  questions?: TriviaQuestion[];
  answers?: number[];
  data?: GameData;
  config?: GameConfig;
  navigation?: GameNavigationState;
  timer?: GameTimerState;
  stats?: GameSessionStats;
  error?: string;
  score?: number;
  total?: number;
  trivia?: TriviaQuestion;
  selected?: number | null;
  loading?: boolean;
  favorites?: Array<{ topic: string; difficulty: string }>;
  gameMode?: SharedGameModeConfig;
  streak?: number;
}

/**
 * Game timer state
 * @used_by client/src/components/game/GameTimer.tsx, client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameTimerState {
  timeRemaining: number;
  startTime: number;
  endTime?: number;
  isRunning: boolean;
  isPaused: boolean;
  lowTimeWarning?: boolean;
}

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
  topicsPlayed?: Record<string, number>;
  successRateByDifficulty?: Record<string, { correct: number; total: number }>;
  questionsAnswered: number;
  correctAnswers: number;
  score: number;
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
  lastGameMode: string | null;
  sessionCount: number;
  lastScore?: number;
  lastTimeElapsed?: number;
}

/**
 * Game statistics update
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameStatsUpdate {
  score: number;
  timeSpent: number;
  isCorrect: boolean;
  responseTime: number;
}

/**
 * Game session update
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionUpdate {
  sessionId: string;
  statsUpdate: GameStatsUpdate;
  timestamp: Date;
  lastScore: number;
  lastTimeElapsed?: number;
}

/**
 * Extended game mode configuration
 * @used_by client/src/components/game-mode/GameMode.tsx
 */
export interface GameModeConfig extends SharedGameModeConfig {
  additionalSettings?: {
    showHints?: boolean;
    allowSkip?: boolean;
    showExplanations?: boolean;
  };
}

/**
 * Game mode default settings
 * @used_by client/src/constants/gameModeDefaults.ts, client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeDefaults {
  timeLimit: number;
  questionLimit: number;
}
