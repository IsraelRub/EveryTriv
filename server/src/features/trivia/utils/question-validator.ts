// Import shared question validation utilities
import { 
  validateQuestion,
  sanitizeQuestion,
  QuestionValidationResult
} from '../../../../../shared/utils/question.utils';

// Import shared types
import { TriviaQuestion } from '../../../../../shared/types/api.types';

// Re-export shared utilities
export { validateQuestion, sanitizeQuestion, QuestionValidationResult };

export class QuestionValidator {
  static validateQuestion(question: TriviaQuestion): QuestionValidationResult {
    // Use shared validation function
    return validateQuestion(question);
  }

  static sanitizeQuestion(question: TriviaQuestion): TriviaQuestion {
    // Use shared sanitization function
    return sanitizeQuestion(question);
  }
}
