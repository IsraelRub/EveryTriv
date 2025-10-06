/**
 * Game Component Types
 * @module GameComponentTypes
 * @description Game component prop types and interfaces
 */
import { BasicValue, GameMode, GameModeConfig } from '@shared';
import { FormEvent } from 'react';

import { Achievement } from './achievements.types';
import { GameConfig, GameSessionStats, GameState, GameTimerState } from './config.types';

/**
 * @interface CurrentQuestionMetadata
 * @description Metadata for the current question being displayed
 */
export interface CurrentQuestionMetadata {
  customDifficultyMultiplier?: number;
  actualDifficulty?: string;
  questionCount?: number;
}

/**
 * Game component props interface
 * @interface GameProps
 * @description Props for the Game component
 * @used_by client/src/components/game/Game.tsx
 */
export interface GameProps {
  config: GameConfig;
  state: GameState;
  onStateChange: (newState: GameState) => void;
  onGameComplete: (finalScore: number, timeSpent: number) => void;
  onError: (error: string) => void;
  className?: string;
  trivia?: {
    id: string;
    question: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
    difficulty?: string;
    topic?: string;
  };
  selected?: number | null;
  score?: number;
  gameMode?: GameModeConfig;
  onAnswer?: (index: number) => Promise<void>;
  onNewQuestion?: () => Promise<void>;
  onGameEnd?: () => void;
}

/**
 * Props for game timer component
 * @used_by client/src/components/game/GameTimer.tsx
 */
export interface GameTimerProps {
  timer: GameTimerState;
  onTimeUpdate: (timeRemaining: number) => void;
  onLowTimeWarning: () => void;
  onTimeUp: () => void;
  className?: string;
  isRunning?: boolean;
  timeRemaining?: number;
  timeElapsed?: number;
  isGameOver?: boolean;
  mode?: {
    name: string;
    timeLimit: number;
    questionLimit: number;
  };
}

/**
 * Props for trivia component
 * @used_by client/src/components/game/TriviaGame.tsx
 */
export interface TriviaGameProps {
  trivia: {
    id: string;
    question: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
  };
  selected?: number | null;
  onAnswer: (index: number) => void;
}

/**
 * Props for trivia form component
 * @used_by client/src/components/game/TriviaForm.tsx
 */
export interface TriviaFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: string, value: BasicValue) => void;
  values: Record<string, BasicValue>;
  loading?: boolean;
  className?: string;
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  onTopicChange?: (topic: string) => void;
  onDifficultyChange?: (difficulty: string) => void;
  onQuestionCountChange?: (count: number) => void;
  onClose?: () => void;
  onGameModeSelect?: (mode: string) => void;
  showGameModeSelector?: boolean;
  onGameModeSelectorClose?: () => void;
}

/**
 * Props for favorite topics component
 * @used_by client/src/components/user/FavoriteTopics.tsx
 */
export interface FavoriteTopicsProps {
  favorites: Array<{ topic: string; difficulty: string }>;
  onRemove: (index: number) => void;
  onSelect?: (favorite: { topic: string; difficulty: string }) => void;
  className?: string;
}

/**
 * Props for game mode UI component
 * @used_by client/src/components/gameMode/GameMode.tsx
 */
export interface GameModeUIProps {
  currentMode?: string;
  onModeChange?: (mode: string) => void;
  onTopicChange?: (topic: string) => void;
  onDifficultyChange?: (difficulty: string) => void;
  className?: string;
  isVisible?: boolean;
  onSelectMode?: (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => void;
  onModeSelect?: (mode: string) => void;
  onCancel?: () => void;
}

/**
 * Props for achievements component
 * @used_by client/src/components/stats
 */
export interface AchievementsProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

/**
 * Props for scoring statistics component
 * @used_by client/src/components/stats/ScoringSystem.tsx
 */
export interface ScoringSystemProps {
  currentScore: number;
  maxScore: number;
  successRate: number;
  currentStreak: number;
  maxStreak: number;
  className?: string;
  stats?: GameSessionStats;
  score?: number;
  total?: number;
  topicsPlayed?: string[];
  difficultyStats?: Record<string, { correct: number; total: number }>;
  currentQuestionMetadata?: CurrentQuestionMetadata;
}

/**
 * Props for custom difficulty history component
 * @used_by client/src/components/stats/CustomDifficultyHistory.tsx
 */
export interface CustomDifficultyHistoryProps {
  history?: Array<{
    difficulty: string;
    score: number;
    date: string;
  }>;
  onItemClick?: (item: { id: string; name: string; value: number }) => void;
  className?: string;
  isVisible?: boolean;
  onClose?: () => void;
  onSelect?: (topic: string, difficulty: string) => void;
}

/**
 * Props for current difficulty component
 * @used_by client/src/components/home/CurrentDifficulty.tsx
 */
export interface CurrentDifficultyProps {
  difficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  className?: string;
  delay?: number;
  topic?: string;
  onShowHistory?: () => void;
}

/**
 * Props for home title component
 * @used_by client/src/components/home/HomeTitle.tsx
 */
export interface HomeTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  delay?: number;
}

/**
 * Props for error component
 * @used_by client/src/components/home/ErrorBanner.tsx
 */
export interface ErrorBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
  difficulty?: string;
}

/**
 * Props for social sharing component
 * @used_by client/src/components/layout/SocialShare.tsx
 */
export interface SocialShareProps {
  text?: string;
  url?: string;
  platforms?: string[];
  className?: string;
  score?: number;
  total?: number;
  topic?: string;
  difficulty?: string;
}

/**
 * Props for leaderboard component
 * @used_by client/src/components/leaderboard/Leaderboard.tsx
 */
export interface LeaderboardProps {
  entries?: Array<{
    rank: number;
    username: string;
    score: number;
    avatar?: string;
  }>;
  onEntryClick?: (entry: { id: string; username: string; score: number; rank: number }) => void;
  className?: string;
  userId?: string;
}
