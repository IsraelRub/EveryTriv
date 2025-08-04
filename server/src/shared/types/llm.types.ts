export interface LLMProvider {
  generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<{
    question: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
  }>;
}
