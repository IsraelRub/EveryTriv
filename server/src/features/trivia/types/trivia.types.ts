import { TriviaQuestion } from '../../../shared/types/trivia.types';

/**
 * Interface for Language Model providers that can generate trivia questions
 */
export interface LLMProvider {
  name: string;
  generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<TriviaQuestion>;
}

/**
 * Interface for queue items in the priority queue
 */
export interface QueueItem {
  id: string;
  topic: string;
  difficulty: string;
  priority: number;
  userId?: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Interface for queue statistics
 */
export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number;
}
