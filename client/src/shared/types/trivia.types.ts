export type QuestionCount = 3 | 4 | 5;

export interface ScoreMultipliers {
  difficulty: number;
  time: number;
  options: number;
  streak: number;
}

export interface GameScore {
  baseScore: number;
  multipliers: ScoreMultipliers;
  finalScore: number;
  streak: number;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: string;
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