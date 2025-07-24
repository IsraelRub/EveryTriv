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

export interface UserProfileDto {
  userId: string;
  username: string;
  avatar?: string;
}

export interface LLMProvider {
  name: string;
  generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<TriviaQuestion>;
}

export interface LLMProvider {
  name: string;
  generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<TriviaQuestion>;
}
