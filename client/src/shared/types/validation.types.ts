/**
 * Validation-related types for EveryTriv
 */

// Language Tool API types
export interface LanguageToolError {
  message: string;
  offset: number;
  length: number;
  rule: {
    id: string;
    description: string;
    category: string;
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
}

export interface LanguageToolResponse {
  software: {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    status: string;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage: {
      name: string;
      code: string;
    };
  };
  matches: LanguageToolError[];
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}

export interface CustomDifficultyValidation {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

// Trivia input validation types
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

// Validation hook types
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
