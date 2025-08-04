export type QuestionCount = 3 | 4 | 5;

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