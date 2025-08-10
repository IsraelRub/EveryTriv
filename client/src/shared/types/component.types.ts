/**
 * Component-related types for EveryTriv
 */

import { FormEvent } from 'react';
import { AudioCategory } from '../constants/audio.constants';
import { GameMode, QuestionCount, TriviaQuestion } from './game.types';

// Component prop types
export interface ScoringSystemProps {
  score: number;
  total: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  streak?: number;
  difficulty?: string;
  answerCount?: number;
}

export interface TriviaFormProps {
  topic: string;
  difficulty: string;
  questionCount: QuestionCount;
  loading: boolean;
  onTopicChange: (topic: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onQuestionCountChange: (count: QuestionCount) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onAddFavorite: () => void;
  onGameModeSelect: (config: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
  }) => void;
  showGameModeSelector?: boolean;
  onGameModeSelectorClose?: () => void;
}

export interface TriviaGameProps {
  trivia: TriviaQuestion;
  selected: number | null;
  onAnswer: (index: number) => void;
}

// Component props that reference user types
export interface LeaderboardProps {
  userId?: string;
}

// Audio component types
export interface AudioControlsProps {
  className?: string;
}

export interface CategoryVolumeControlProps {
  category: AudioCategory;
  label: string;
  className?: string;
}
