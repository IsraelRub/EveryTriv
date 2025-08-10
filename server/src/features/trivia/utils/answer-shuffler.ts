// Import shared utilities
import { 
  shuffleAnswers 
} from '../../../../../shared/utils/question.utils';

// Import shared types
import { TriviaQuestion } from '../../../../../shared/types/api.types';

export class AnswerShuffler {
  /**
   * Shuffles answers while maintaining correctAnswerIndex consistency
   * This prevents patterns where correct answer is always in the same position
   */
  static shuffleAnswers(question: TriviaQuestion): TriviaQuestion {
    // Use shared shuffling function
    return shuffleAnswers(question);
  }

  /**
   * Ensures answer distribution is balanced across positions
   * Useful for analytics and preventing position bias
   */
  static getAnswerPositionStats(questions: TriviaQuestion[]): Record<number, number> {
    const positionCounts: Record<number, number> = {};
    
    questions.forEach(q => {
      positionCounts[q.correctAnswerIndex] = (positionCounts[q.correctAnswerIndex] || 0) + 1;
    });
    
    return positionCounts;
  }
}
