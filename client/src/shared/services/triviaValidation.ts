import { validateInput } from './inputValidation';
import { validateCustomDifficultyTextEnhanced as validateCustomDifficultyText } from '../utils/customDifficulty.utils';

export interface TriviaInputValidation {
  topic: {
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  };
  difficulty: {
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  };
  overall: {
    isValid: boolean;
    canProceed: boolean;
  };
}

export class TriviaValidationService {
  /**
   * Comprehensive validation for trivia input combining language validation
   * with custom difficulty validation
   */
  static async validateTriviaInput(
    topic: string, 
    difficulty: string
  ): Promise<TriviaInputValidation> {
    const result: TriviaInputValidation = {
      topic: { isValid: true, errors: [] },
      difficulty: { isValid: true, errors: [] },
      overall: { isValid: true, canProceed: true }
    };

    // Validate topic using language validation
    if (topic.trim()) {
      try {
        const topicValidation = await validateInput(topic);
        result.topic.isValid = topicValidation.isValid;
        result.topic.errors = topicValidation.errors.map(e => e.message);
        
        // Additional topic-specific validation
        if (topic.length < 2) {
          result.topic.isValid = false;
          result.topic.errors.push('Topic must be at least 2 characters long');
        }
        
        if (topic.length > 100) {
          result.topic.isValid = false;
          result.topic.errors.push('Topic must be less than 100 characters');
        }
      } catch (error) {
        console.warn('Language validation service unavailable for topic');
        // Basic fallback validation
        if (topic.length < 2 || topic.length > 100) {
          result.topic.isValid = false;
          result.topic.errors.push('Topic must be between 2-100 characters');
        }
      }
    } else {
      result.topic.isValid = false;
      result.topic.errors.push('Topic is required');
    }

    // Validate difficulty
    if (difficulty.startsWith('custom:')) {
      const customText = difficulty.substring(7);
      const customValidation = validateCustomDifficultyText(customText);
      
      result.difficulty.isValid = customValidation.isValid;
      if (customValidation.error) {
        result.difficulty.errors.push(customValidation.error);
      }
      result.difficulty.suggestions = customValidation.suggestions;
      
      // Additional language validation for custom difficulty
      if (customText.trim()) {
        try {
          const difficultyLanguageValidation = await validateInput(customText);
          if (!difficultyLanguageValidation.isValid) {
            result.difficulty.errors.push(
              ...difficultyLanguageValidation.errors.map(e => `Language: ${e.message}`)
            );
          }
        } catch (error) {
          console.warn('Language validation service unavailable for difficulty');
        }
      }
    } else {
      // Standard difficulty validation
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        result.difficulty.isValid = false;
        result.difficulty.errors.push('Please select a valid difficulty level');
        result.difficulty.suggestions = [
          'Choose from: easy, medium, hard',
          'Or create a custom difficulty description'
        ];
      }
    }

    // Overall validation
    result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
    result.overall.canProceed = result.overall.isValid;

    return result;
  }

  /**
   * Quick validation for form fields (without async language validation)
   */
  static validateQuick(topic: string, difficulty: string): TriviaInputValidation {
    const result: TriviaInputValidation = {
      topic: { isValid: true, errors: [] },
      difficulty: { isValid: true, errors: [] },
      overall: { isValid: true, canProceed: true }
    };

    // Quick topic validation
    if (!topic.trim()) {
      result.topic.isValid = false;
      result.topic.errors.push('Topic is required');
    } else if (topic.length < 2) {
      result.topic.isValid = false;
      result.topic.errors.push('Topic must be at least 2 characters');
    } else if (topic.length > 100) {
      result.topic.isValid = false;
      result.topic.errors.push('Topic must be less than 100 characters');
    }

    // Quick difficulty validation
    if (difficulty.startsWith('custom:')) {
      const customText = difficulty.substring(7);
      const customValidation = validateCustomDifficultyText(customText);
      result.difficulty.isValid = customValidation.isValid;
      if (customValidation.error) {
        result.difficulty.errors.push(customValidation.error);
      }
      result.difficulty.suggestions = customValidation.suggestions;
    } else {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        result.difficulty.isValid = false;
        result.difficulty.errors.push('Please select a valid difficulty level');
      }
    }

    result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
    result.overall.canProceed = result.overall.isValid;

    return result;
  }

  /**
   * Get validation suggestions for improving input
   */
  static getImprovementSuggestions(
    topic: string, 
    difficulty: string
  ): { topic: string[]; difficulty: string[] } {
    const suggestions = {
      topic: [] as string[],
      difficulty: [] as string[]
    };

    // Topic suggestions
    if (topic.length < 10) {
      suggestions.topic.push('Try to be more specific with your topic');
    }
    
    if (!topic.includes(' ') && topic.length > 15) {
      suggestions.topic.push('Consider breaking long single words into phrases');
    }

    // Difficulty suggestions
    if (difficulty.startsWith('custom:')) {
      const customText = difficulty.substring(7);
      if (!customText.includes('level') && !customText.includes('grade')) {
        suggestions.difficulty.push('Consider adding "level" or "grade" to clarify difficulty');
      }
    } else {
      suggestions.difficulty.push('Try custom difficulty for more specific challenges');
    }

    return suggestions;
  }
}
