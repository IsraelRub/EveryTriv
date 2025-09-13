/**
 * Game Configuration Types
 * @module GameConfigTypes
 * @description Game configuration and setup types
 */
import { DifficultyLevel, GameMode, TriviaQuestion } from '@shared';
import { GameModeConfig as SharedGameModeConfig,TriviaAnswer } from '@shared';
// FormEvent import removed as it's not used

// Game configuration types
/**
 * קונפיגורציית משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig
  extends Pick<SharedGameModeConfig, 'mode' | 'timeLimit' | 'questionLimit'> {
  /** נושא המשחק */
  topic: string;
  /** רמת הקושי */
  difficulty: DifficultyLevel;
  /** הגדרות נוספות */
  settings?: {
    /** האם להציג טיימר */
    showTimer?: boolean;
    /** האם להציג התקדמות */
    showProgress?: boolean;
    /** האם לאפשר חזרה לשאלה קודמת */
    allowBackNavigation?: boolean;
  };
}

/**
 * נתוני משחק
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game/Game.tsx
 */
export interface GameData {
  /** רשימת השאלות */
  questions: TriviaQuestion[];
  /** התשובות של המשתמש */
  answers: TriviaAnswer[];
  /** ניקוד נוכחי */
  score: number;
  /** שאלה נוכחית */
  currentQuestionIndex: number;
  /** זמן התחלה */
  startTime: Date;
  /** זמן סיום */
  endTime?: Date;
}

/**
 * מטען קונפיגורציית מצב משחק
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeConfigPayload {
  /** מצב המשחק */
  mode: GameMode;
  /** נושא */
  topic: string;
  /** רמת קושי */
  difficulty: DifficultyLevel;
  /** הגבלת זמן */
  timeLimit?: number;
  /** הגבלת שאלות */
  questionLimit?: number;
  /** קונפיגורציה */
  config?: Record<string, unknown>;
}

/**
 * מצב מצב משחק
 * @used_by client/src/redux/features/gameModeSlice.ts
 */
export interface GameModeState {
  /** מצב נוכחי */
  currentMode: GameMode;
  /** נושא נוכחי */
  currentTopic: string;
  /** רמת קושי נוכחית */
  currentDifficulty: DifficultyLevel;
  /** הגדרות נוכחיות */
  currentSettings: GameModeConfigPayload;
  /** האם מצב המשחק נטען */
  isLoading: boolean;
  /** שגיאה במצב המשחק */
  error?: string;
}

/**
 * מצב ניווט במשחק
 * @used_by client/src/components/game/Game.tsx, client/src/views/game/GameView.tsx
 */
export interface GameNavigationState {
  /** שאלה נוכחית */
  currentQuestion: number;
  /** סה"כ שאלות */
  totalQuestions: number;
  /** האם ניתן לחזור */
  canGoBack: boolean;
  /** האם ניתן להמשיך */
  canGoForward: boolean;
  /** האם המשחק הסתיים */
  isGameComplete: boolean;
}

/**
 * Game state
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/redux/features/gameSlice.ts
 */
export interface GameState {
  /** Game status */
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  /** Is playing */
  isPlaying?: boolean;
  /** Current question */
  currentQuestion?: number;
  /** Total questions */
  totalQuestions?: number;
  /** Time remaining */
  timeRemaining?: number;
  /** Difficulty */
  difficulty?: string;
  /** Topic */
  topic?: string;
  /** Questions */
  questions?: TriviaQuestion[];
  /** Answers */
  answers?: number[];
  /** Game data */
  data?: GameData;
  /** Game configuration */
  config?: GameConfig;
  /** Navigation state */
  navigation?: GameNavigationState;
  /** Timer */
  timer?: GameTimerState;
  /** Statistics */
  stats?: GameSessionStats;
  /** Error */
  error?: string;
  /** Score */
  score?: number;
  /** Total */
  total?: number;
  /** Trivia question */
  trivia?: TriviaQuestion;
  /** Selected answer */
  selected?: number | null;
  /** Is loading */
  loading?: boolean;
  /** Favorite topics */
  favorites?: Array<{ topic: string; difficulty: string }>;
  /** Game mode */
  gameMode?: SharedGameModeConfig;
  /** Streak */
  streak?: number;
}

/**
 * Game timer state
 * @used_by client/src/components/game/GameTimer.tsx, client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameTimerState {
  /** Time remaining */
  timeRemaining: number;
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
  /** Is timer running */
  isRunning: boolean;
  /** Is timer paused */
  isPaused: boolean;
  /** Low time warning */
  lowTimeWarning?: boolean;
}

/**
 * Game session statistics
 * @used_by client/src/hooks/layers/business/useGameLogic.ts, client/src/components/stats/ScoringSystem.tsx
 */
export interface GameSessionStats {
  /** Current score */
  currentScore: number;
  /** Maximum score */
  maxScore: number;
  /** Success rate */
  successRate: number;
  /** Average time per question */
  averageTimePerQuestion: number;
  /** Correct answer streak */
  correctStreak: number;
  /** Maximum streak */
  maxStreak: number;
  /** Topics played */
  topicsPlayed?: Record<string, number>;
  /** Success rate by difficulty */
  successRateByDifficulty?: Record<string, { correct: number; total: number }>;
  /** Questions answered */
  questionsAnswered: number;
  /** Correct answers */
  correctAnswers: number;
  /** Score */
  score: number;
  /** Total games */
  totalGames: number;
  /** Time elapsed */
  timeElapsed?: number;
}

/**
 * Game session data
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionData {
  /** Session ID */
  sessionId?: string;
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Duration */
  duration?: number;
  /** Statistics */
  stats?: GameSessionStats;
  /** Results */
  results?: TriviaAnswer[];
  /** Last game mode */
  lastGameMode: string | null;
  /** Session count */
  sessionCount: number;
  /** Last score */
  lastScore?: number;
  /** Last time elapsed */
  lastTimeElapsed?: number;
}

/**
 * Game statistics update
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameStatsUpdate {
  /** New score */
  score: number;
  /** Additional time */
  timeSpent: number;
  /** Correct answer */
  isCorrect: boolean;
  /** Response time */
  responseTime: number;
}

/**
 * Game session update
 * @used_by client/src/hooks/layers/business/useGameLogic.ts
 */
export interface GameSessionUpdate {
  /** Session ID */
  sessionId: string;
  /** Statistics update */
  statsUpdate: GameStatsUpdate;
  /** Update timestamp */
  timestamp: Date;
  /** Last score */
  lastScore: number;
  /** Last time elapsed */
  lastTimeElapsed?: number;
}

/**
 * Extended game mode configuration
 * @used_by client/src/components/game-mode/GameMode.tsx
 */
export interface GameModeConfig extends SharedGameModeConfig {
  /** Additional settings */
  additionalSettings?: {
    /** Show hints */
    showHints?: boolean;
    /** Allow skipping questions */
    allowSkip?: boolean;
    /** Show explanations */
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
