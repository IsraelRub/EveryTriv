/**
 * Shared validation utilities for EveryTriv
 * Used by both client and server for input validation
 */

// LanguageTool API interfaces
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
      confidence: number;
    };
  };
  matches: LanguageToolError[];
}

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

// Validation functions that can be shared
export function validateTopicLength(topic: string): { isValid: boolean; error?: string } {
  const trimmed = topic.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Topic must be at least 2 characters long' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Topic must be less than 100 characters' };
  }
  
  return { isValid: true };
}

export function validateCustomDifficultyText(text: string): { isValid: boolean; error?: string } {
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Please enter a difficulty description' };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Description must be at least 3 characters long' };
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Description must be less than 200 characters' };
  }

  // Basic content validation
  const forbiddenWords = ['spam', 'test', 'xxx'];
  const lowerText = trimmed.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerText.includes(word)) {
      return { isValid: false, error: 'Please enter a meaningful difficulty description' };
    }
  }
  
  return { isValid: true };
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' };
  }
  
  // Allow only alphanumeric characters and underscores
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true };
}

export function validateQuestionCount(count: number): { isValid: boolean; error?: string } {
  if (![3, 4, 5].includes(count)) {
    return { isValid: false, error: 'Question count must be 3, 4, or 5' };
  }
  
  return { isValid: true };
}

// Convert LanguageTool response to standardized ValidationResult
export function parseLanguageToolResponse(response: LanguageToolResponse): ValidationResult {
  const errors = response.matches.map(error => ({
    message: error.message,
    suggestion: error.rule.description,
    position: {
      start: error.offset,
      end: error.offset + error.length,
    },
  }));

  return {
    isValid: errors.length === 0,
    errors,
  };
}
