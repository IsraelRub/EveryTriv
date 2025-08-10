/**
 * Validation constants for EveryTriv
 */

// Language Tool API configuration
export const LANGUAGE_TOOL_CONFIG = {
  API_URL: 'https://api.languagetool.org/v2/check',
  DEFAULT_LANGUAGE: 'auto',
  REQUEST_TIMEOUT: 5000,
} as const;

// Validation error categories
export const VALIDATION_ERROR_CATEGORIES = {
  GRAMMAR: 'GRAMMAR',
  SPELLING: 'TYPOS',
  STYLE: 'STYLE',
  PUNCTUATION: 'PUNCTUATION',
  TYPOGRAPHY: 'TYPOGRAPHY',
} as const;

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  TOPIC: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
} as const;

// Validation message templates
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  TOO_SHORT: 'Must be at least {min} characters long',
  TOO_LONG: 'Must be less than {max} characters long',
  INVALID_FORMAT: 'Invalid format',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_USERNAME: 'Username must be 3-20 characters, letters, numbers, and underscores only',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  LANGUAGE_SERVICE_UNAVAILABLE: 'Language validation service temporarily unavailable',
} as const;

// Debounce delays for different validation types
export const VALIDATION_DEBOUNCE_DELAYS = {
  QUICK: 150,
  STANDARD: 300,
  LANGUAGE_CHECK: 500,
  ASYNC_VALIDATION: 1000,
} as const;
