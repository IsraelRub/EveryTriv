import { FormEvent } from "react";

// Common types shared between client and server
export type QuestionCount = 3 | 4 | 5;

// Trivia types
export interface TriviaAnswer {
  text: string;
  isCorrect: boolean;
}

export interface TriviaQuestion {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: TriviaAnswer[];
  correctAnswerIndex: number;
  createdAt: Date;
}

export interface TriviaGameConfig {
  questionCount: QuestionCount;
  difficulty: string;
  category?: string;
}

export interface TriviaGameState {
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  score: number;
  isGameOver: boolean;
  config: TriviaGameConfig;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  score: number;
  credits: number;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserState {
  username: string;
  avatar: string;
  credits: number;
}

export interface UserStats {
  id: string;
  userId: string;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
  correctAnswers: number;
  lastPlayed: Date;
}

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'first_correct' | 'master_easy' | 'topic_explorer' | 'streak_master' | 'hard_champion';
  condition: (stats: GameStats) => boolean;
  progress: (stats: GameStats) => number;
  target: number;
}

export interface GameStats {
  totalGames: number;
  correctAnswers: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  streaks: {
    current: number;
    best: number;
  };
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  rank?: number;
}

export interface LeaderboardProps {
  userId: string;
}

// Game History types
export interface GameHistoryEntry {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: string;
  topic?: string;
  gameMode: 'time-limited' | 'question-limited' | 'unlimited';
  timeSpent?: number;
  creditsUsed: number;
  createdAt: Date;
}

// API types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}

// Game state types
export interface GameState {
  favorites: Array<{
    topic: string;
    difficulty: string;
  }>;
  trivia: TriviaQuestion | null;
  loading: boolean;
  error: string;
  score: number;
  total: number;
  selected: number | null;
  streak: number;
  stats: {
    topicsPlayed: Record<string, number>;
    successRateByDifficulty: Record<string, { correct: number; total: number }>;
  };
  gameMode: {
    mode: 'time-limited' | 'question-limited' | 'unlimited';
    timeLimit?: number;  // Time in seconds for time-limited mode
    questionLimit?: number; // Number of questions for question-limited mode
    timeRemaining?: number; // Seconds remaining in time-limited mode
    questionsRemaining?: number; // Questions remaining in question-limited mode
    isGameOver: boolean;
    timer: {
      isRunning: boolean;
      startTime: number | null;
      timeElapsed: number;
    }
  };
}

// Default values for scoring system
export const SCORING_DEFAULTS = {
  STREAK: 0,
  DIFFICULTY: 'easy',
  ANSWER_COUNT: 4
} as const;

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
}

export interface TriviaGameProps {
  trivia: TriviaQuestion;
  selected: number | null;
  onAnswer: (index: number) => void;
}

export interface CustomDifficultyHistoryProps {
  isVisible: boolean;
  onSelect: (item: { topic: string; difficulty: string }) => void;
  onClose: () => void;
}

// Constants
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_correct',
    title: 'First Steps',
    description: 'Get your first correct answer',
    icon: 'first_correct',
    condition: (stats) => stats.correctAnswers >= 1,
    progress: (stats) => Math.min(stats.correctAnswers, 1),
    target: 1,
  },
  {
    id: 'master_easy',
    title: 'Easy Master',
    description: 'Get 90% success rate in Easy difficulty (min. 10 questions)',
    icon: 'master_easy',
    condition: (stats) => {
      const easy = stats.difficultyStats['easy'] || { correct: 0, total: 0 };
      return easy.total >= 10 && easy.correct / easy.total >= 0.9;
    },
    progress: (stats) => {
      const easy = stats.difficultyStats['easy'] || { correct: 0, total: 0 };
      return easy.total >= 10 ? (easy.correct / easy.total) * 100 : 0;
    },
    target: 90,
  },
  {
    id: 'topic_explorer',
    title: 'Topic Explorer',
    description: 'Play questions from 5 different topics',
    icon: 'topic_explorer',
    condition: (stats) => Object.keys(stats.topicsPlayed).length >= 5,
    progress: (stats) => Object.keys(stats.topicsPlayed).length,
    target: 5,
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Get a streak of 5 correct answers',
    icon: 'streak_master',
    condition: (stats) => stats.streaks.best >= 5,
    progress: (stats) => stats.streaks.best,
    target: 5,
  },
  {
    id: 'hard_champion',
    title: 'Hard Champion',
    description: 'Answer 10 hard questions correctly',
    icon: 'hard_champion',
    condition: (stats) => {
      const hard = stats.difficultyStats['hard'] || { correct: 0, total: 0 };
      return hard.correct >= 10;
    },
    progress: (stats) => {
      const hard = stats.difficultyStats['hard'] || { correct: 0, total: 0 };
      return hard.correct;
    },
    target: 10,
  },
];