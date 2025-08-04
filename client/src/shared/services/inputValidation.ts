import { ValidationResult } from '@/shared/types';

interface LanguageToolError {
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

interface LanguageToolResponse {
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

export async function validateInput(text: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language: 'en-US',
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error('Language validation service unavailable');
    }

    const data: LanguageToolResponse = await response.json();

    const errors = data.matches.map(error => ({
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
  } catch (error) {
    console.error('Input validation error:', error);
    // Return valid result if service is unavailable
    return {
      isValid: true,
      errors: [],
    };
  }
}

export function highlightErrors(text: string, errors: ValidationResult['errors']): string {
  let result = text;
  let offset = 0;

  // Sort errors by position to handle them in order
  const sortedErrors = [...errors].sort((a, b) => a.position.start - b.position.start);

  for (const error of sortedErrors) {
    const start = error.position.start + offset;
    const end = error.position.end + offset;
    const highlight = `<span class="text-danger" title="${error.message}">${text.slice(error.position.start, error.position.end)}</span>`;
    result = result.slice(0, start) + highlight + result.slice(end);
    offset += highlight.length - (error.position.end - error.position.start);
  }

  return result;
}