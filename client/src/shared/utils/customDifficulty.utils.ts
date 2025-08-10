/**
 * Client-specific custom difficulty utilities for EveryTriv
 * Uses shared utilities from the shared folder
 */

// Import shared utilities
import {
  isCustomDifficulty,
  extractCustomDifficultyText,
  createCustomDifficulty,
  getDifficultyDisplayText,
  getCustomDifficultyMultiplier,
  getSuggestionsForDifficulty,
  normalizeCustomDifficulty,
  hasValidCustomDifficultyContent
} from '../../../../shared/utils/customDifficulty.utils';

// Import shared constants
import {
  DIFFICULTY_LEVELS,
  CUSTOM_DIFFICULTY_KEYWORDS,
  GENERAL_DIFFICULTY_SUGGESTIONS
} from '../../../../shared/constants/game.constants';

// Import shared validation
import { validateCustomDifficultyText } from '../../../../shared/validation/validation.utils';

// Client-specific constants that remain here
import {
  DIFFICULTY_BADGE_CLASSES,
  TOPIC_DIFFICULTY_SUGGESTIONS
} from '../constants/game.constants';

import { EasyIcon, MediumIcon, HardIcon, CustomIcon } from '../components/icons';
import { FC } from 'react';

// Re-export shared utilities for backward compatibility
export {
  isCustomDifficulty,
  extractCustomDifficultyText,
  createCustomDifficulty,
  getDifficultyDisplayText,
  getCustomDifficultyMultiplier,
  getSuggestionsForDifficulty,
  normalizeCustomDifficulty,
  hasValidCustomDifficultyContent
};

// Client-specific display utility
export const displayDifficulty = (difficulty: string, maxLength: number = 50): string => {
  if (isCustomDifficulty(difficulty)) {
    const customText = extractCustomDifficultyText(difficulty);
    const displayText = customText.length > maxLength 
      ? `${customText.substring(0, maxLength)}...` 
      : customText;
    return `Custom: ${displayText}`;
  }
  
  switch (difficulty.toLowerCase()) {
    case DIFFICULTY_LEVELS.EASY:
      return 'Easy';
    case DIFFICULTY_LEVELS.MEDIUM:
      return 'Medium';
    case DIFFICULTY_LEVELS.HARD:
      return 'Hard';
    default:
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
};

// Client-specific badge class utility
export const getDifficultyBadgeClass = (difficulty: string): string => {
  if (isCustomDifficulty(difficulty)) {
    return DIFFICULTY_BADGE_CLASSES.CUSTOM;
  }
  
  switch (difficulty.toLowerCase()) {
    case DIFFICULTY_LEVELS.EASY:
      return DIFFICULTY_BADGE_CLASSES[DIFFICULTY_LEVELS.EASY];
    case DIFFICULTY_LEVELS.MEDIUM:
      return DIFFICULTY_BADGE_CLASSES[DIFFICULTY_LEVELS.MEDIUM];
    case DIFFICULTY_LEVELS.HARD:
      return DIFFICULTY_BADGE_CLASSES[DIFFICULTY_LEVELS.HARD];
    default:
      return DIFFICULTY_BADGE_CLASSES.DEFAULT;
  }
};

// Enhanced validation with client-specific suggestions
export const validateCustomDifficultyTextEnhanced = (text: string): { 
  isValid: boolean; 
  error?: string; 
  suggestions?: string[] 
} => {
  // Use shared validation first
  const baseValidation = validateCustomDifficultyText(text);
  if (!baseValidation.isValid) {
    return {
      isValid: false,
      error: baseValidation.error,
      suggestions: ['Example: "university level physics"']
    };
  }

  const trimmedText = text.trim();
  const recommendedKeywords = [
    ...CUSTOM_DIFFICULTY_KEYWORDS.LEVELS,
    ...CUSTOM_DIFFICULTY_KEYWORDS.EDUCATION,
    ...CUSTOM_DIFFICULTY_KEYWORDS.DESCRIPTORS
  ];

  const lowerText = trimmedText.toLowerCase();
  const hasKeyword = recommendedKeywords.some(keyword => lowerText.includes(keyword));

  if (!hasKeyword) {
    return {
      isValid: true, // Still valid, but with suggestions
      suggestions: [
        'Consider adding difficulty indicators like "beginner", "advanced", "professional"',
        'Examples: "beginner cooking", "professional sports", "university physics"'
      ]
    };
  }

  return { isValid: true };
};

// Client-specific suggestions that use topic-specific data
export const getCustomDifficultySuggestions = (topic?: string): string[] => {
  if (!topic) return [...GENERAL_DIFFICULTY_SUGGESTIONS];

  const topicLower = topic.toLowerCase();
  
  // Find matching category
  const matchingCategory = Object.keys(TOPIC_DIFFICULTY_SUGGESTIONS).find(category => 
    topicLower.includes(category)
  ) as keyof typeof TOPIC_DIFFICULTY_SUGGESTIONS;

  if (matchingCategory) {
    return [
      ...TOPIC_DIFFICULTY_SUGGESTIONS[matchingCategory],
      ...GENERAL_DIFFICULTY_SUGGESTIONS.slice(0, 3)
    ];
  }

  // If no specific match, create general suggestions with the topic
  return [
    `beginner ${topic}`,
    `intermediate ${topic}`,
    `advanced ${topic}`,
    `professional ${topic} knowledge`,
    ...GENERAL_DIFFICULTY_SUGGESTIONS.slice(0, 3)
  ];
};

// Client-specific icon utility
export const getDifficultyIcon = (difficulty: string): FC => {
  if (isCustomDifficulty(difficulty)) {
    return CustomIcon;
  }
  
  switch (difficulty.toLowerCase()) {
    case DIFFICULTY_LEVELS.EASY:
      return EasyIcon;
    case DIFFICULTY_LEVELS.MEDIUM:
      return MediumIcon;
    case DIFFICULTY_LEVELS.HARD:
      return HardIcon;
    default:
      return MediumIcon;
  }
};

// Client-specific title utility
export const getDifficultyTitle = (difficulty: string): string => {
  if (isCustomDifficulty(difficulty)) {
    const customText = extractCustomDifficultyText(difficulty);
    return `Custom difficulty: ${customText}`;
  }
  
  switch (difficulty.toLowerCase()) {
    case DIFFICULTY_LEVELS.EASY:
      return 'Easy difficulty - Perfect for beginners';
    case DIFFICULTY_LEVELS.MEDIUM: 
      return 'Medium difficulty - General knowledge level';
    case DIFFICULTY_LEVELS.HARD:
      return 'Hard difficulty - Expert level questions';
    default:
      return `${difficulty} difficulty level`;
  }
};

// Utility functions for client-specific formatting
export const formatDifficultyForStorage = (difficulty: string): string => {
  return difficulty.trim();
};

export const compareDifficulties = (diff1: string, diff2: string): boolean => {
  return formatDifficultyForStorage(diff1) === formatDifficultyForStorage(diff2);
};
