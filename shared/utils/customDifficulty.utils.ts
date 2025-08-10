/**
 * Shared custom difficulty utilities for EveryTriv
 * Used by both client and server
 */

import { CUSTOM_DIFFICULTY_PREFIX, CUSTOM_DIFFICULTY_MULTIPLIERS } from '../constants/game.constants';

// Utility functions for custom difficulty handling
export function isCustomDifficulty(difficulty: string): boolean {
  return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
}

export function extractCustomDifficultyText(difficulty: string): string {
  if (!isCustomDifficulty(difficulty)) return '';
  return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
}

export function createCustomDifficulty(text: string): string {
  return `${CUSTOM_DIFFICULTY_PREFIX}${text.trim()}`;
}

export function getDifficultyDisplayText(difficulty: string, maxLength: number = 50): string {
  if (!isCustomDifficulty(difficulty)) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
  
  const customText = extractCustomDifficultyText(difficulty);
  if (customText.length <= maxLength) {
    return customText;
  }
  
  return customText.substring(0, maxLength - 3) + '...';
}

// Analyze custom difficulty text to determine multiplier
export function getCustomDifficultyMultiplier(customText: string): number {
  const keywords = customText.toLowerCase().split(/\s+/);
  
  // Expert/PhD level
  if (keywords.some(word => ['expert', 'professional', 'advanced', 'phd', 'doctorate', 'master', 'graduate'].includes(word))) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.EXPERT;
  }
  
  // University/College level  
  if (keywords.some(word => ['university', 'college', 'bachelor', 'undergraduate'].includes(word))) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.UNIVERSITY;
  }
  
  // High school level
  if (keywords.some(word => ['high school', 'secondary', 'intermediate'].includes(word))) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.HIGH_SCHOOL;
  }
  
  // Elementary/Beginner level
  if (keywords.some(word => ['elementary', 'beginner', 'basic', 'simple', 'easy'].includes(word))) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.ELEMENTARY;
  }
  
  // Default multiplier if no specific keywords found
  return CUSTOM_DIFFICULTY_MULTIPLIERS.UNIVERSITY; // Default to university level
}

// Get suggestions based on detected difficulty level
export function getSuggestionsForDifficulty(customText: string): string[] {
  const multiplier = getCustomDifficultyMultiplier(customText);
  
  if (multiplier === CUSTOM_DIFFICULTY_MULTIPLIERS.EXPERT) {
    return [
      'Try adding specific expertise areas',
      'Consider mentioning professional experience level',
      'Add context like "research level" or "industry expert"'
    ];
  }
  
  if (multiplier === CUSTOM_DIFFICULTY_MULTIPLIERS.UNIVERSITY) {
    return [
      'Specify year level (freshman, senior, graduate)',
      'Add specific course context',
      'Consider mentioning field of study'
    ];
  }
  
  if (multiplier === CUSTOM_DIFFICULTY_MULTIPLIERS.HIGH_SCHOOL) {
    return [
      'Specify grade level for better accuracy',
      'Add context like "advanced placement" if applicable',
      'Consider adding subject area specifics'
    ];
  }
  
  return [
    'Be more specific about the knowledge level',
    'Add context about the target audience',
    'Consider using education level indicators'
  ];
}

// Validate and normalize custom difficulty text
export function normalizeCustomDifficulty(text: string): string {
  return text.trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .trim();
}

// Check if custom difficulty contains meaningful content
export function hasValidCustomDifficultyContent(text: string): boolean {
  const normalized = normalizeCustomDifficulty(text);
  
  // Must have at least one meaningful word
  const meaningfulWords = normalized.split(' ').filter(word => 
    word.length > 2 && !['the', 'and', 'for', 'with', 'that'].includes(word)
  );
  
  return meaningfulWords.length > 0;
}
