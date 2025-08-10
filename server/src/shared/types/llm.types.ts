/**
 * LLM (Large Language Model) related types
 */

export type SupportedModel =
  // OpenAI models
  | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  // Anthropic models  
  | 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229'
  // Google models
  | 'gemini-1.5-pro' | 'gemini-1.5-flash'
  // Mistral models
  | 'mistral-large-latest' | 'mistral-small-latest';

export interface LLMProvider {
  name: string;
  generateTriviaQuestion(
    topic: string,
    difficulty: string,
    questionCount?: number
  ): Promise<{
    question: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
    metadata?: {
      actualDifficulty?: string;
      questionCount?: number;
      customDifficultyMultiplier?: number;
    };
  }>;
}

export interface LLMConfig {
  openaiApiKey: string;
  anthropicApiKey: string;
  defaultModel: SupportedModel;
  timeout: number;
  maxRetries: number;
}
