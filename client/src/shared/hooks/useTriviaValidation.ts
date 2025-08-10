import { useState, useEffect, useCallback } from 'react';
import { TriviaValidationService, TriviaInputValidation } from '../services/triviaValidation';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

export interface UseTriviaValidationOptions {
  debounceMs?: number;
  enableLanguageValidation?: boolean;
  autoValidate?: boolean;
}

export interface TriviaValidationHook {
  validation: TriviaInputValidation | null;
  isValidating: boolean;
  validateNow: () => Promise<void>;
  validateQuick: () => void;
  clearValidation: () => void;
  canSubmit: boolean;
}

export function useTriviaValidation(
  topic: string,
  difficulty: string,
  options: UseTriviaValidationOptions = {}
): TriviaValidationHook {
  const {
    debounceMs = 500,
    enableLanguageValidation = true,
    autoValidate = true
  } = options;

  const [validation, setValidation] = useState<TriviaInputValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (currentTopic: string, currentDifficulty: string) => {
      if (!currentTopic.trim() && !currentDifficulty.trim()) {
        setValidation(null);
        return;
      }

      setIsValidating(true);
      try {
        if (enableLanguageValidation) {
          const result = await TriviaValidationService.validateTriviaInput(currentTopic, currentDifficulty);
          setValidation(result);
        } else {
          const result = TriviaValidationService.validateQuick(currentTopic, currentDifficulty);
          setValidation(result);
        }
      } catch (error) {
        console.warn('Validation error:', error);
        // Fallback to quick validation
        const result = TriviaValidationService.validateQuick(currentTopic, currentDifficulty);
        setValidation(result);
      } finally {
        setIsValidating(false);
      }
    }, debounceMs),
    [debounceMs, enableLanguageValidation]
  );

  // Auto-validate when inputs change
  useEffect(() => {
    if (autoValidate && (topic.trim() || difficulty.trim())) {
      debouncedValidate(topic, difficulty);
    }
    
    // Cleanup function to cancel pending validations
    return () => {
      debouncedValidate.cancel();
    };
  }, [topic, difficulty, autoValidate, debouncedValidate]);

  // Manual validation function
  const validateNow = useCallback(async () => {
    debouncedValidate.cancel(); // Cancel any pending debounced validation
    setIsValidating(true);
    
    try {
      const result = enableLanguageValidation
        ? await TriviaValidationService.validateTriviaInput(topic, difficulty)
        : TriviaValidationService.validateQuick(topic, difficulty);
      setValidation(result);
    } catch (error) {
      console.warn('Manual validation error:', error);
      const result = TriviaValidationService.validateQuick(topic, difficulty);
      setValidation(result);
    } finally {
      setIsValidating(false);
    }
  }, [topic, difficulty, enableLanguageValidation, debouncedValidate]);

  // Quick validation without language checking
  const validateQuick = useCallback(() => {
    const result = TriviaValidationService.validateQuick(topic, difficulty);
    setValidation(result);
  }, [topic, difficulty]);

  // Clear validation
  const clearValidation = useCallback(() => {
    debouncedValidate.cancel();
    setValidation(null);
    setIsValidating(false);
  }, [debouncedValidate]);

  // Calculate if form can be submitted
  const canSubmit = validation?.overall.canProceed ?? false;

  return {
    validation,
    isValidating,
    validateNow,
    validateQuick,
    clearValidation,
    canSubmit
  };
}
