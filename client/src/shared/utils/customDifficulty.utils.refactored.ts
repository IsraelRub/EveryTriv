/**
 * Custom difficulty utility functions for EveryTriv
 * Constants have been moved to game.constants.ts
 */

import {
  CUSTOM_DIFFICULTY_PREFIX,
  DIFFICULTY_LEVELS,
  CUSTOM_DIFFICULTY_MULTIPLIERS,
  DIFFICULTY_BADGE_CLASSES,
  VALIDATION_LIMITS,
  CUSTOM_DIFFICULTY_KEYWORDS,
  TOPIC_DIFFICULTY_SUGGESTIONS,
  GENERAL_DIFFICULTY_SUGGESTIONS
} from '../constants/game.constants';

import { EasyIcon, MediumIcon, HardIcon, CustomIcon } from '../components/icons';
import { FC } from 'react';

// Utility functions for custom difficulty handling

export const isCustomDifficulty = (difficulty: string): boolean => {
  return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
};

export const extractCustomDifficultyText = (difficulty: string): string => {
  if (!isCustomDifficulty(difficulty)) return '';
  return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
};

export const createCustomDifficulty = (text: string): string => {
  return `${CUSTOM_DIFFICULTY_PREFIX}${text.trim()}`;
};

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

export const calculateCustomDifficultyMultiplier = (customDifficulty: string): number => {
  const keywords = customDifficulty.toLowerCase();
  
  // Expert/Professional level
  if (keywords.includes('expert') || 
      keywords.includes('professional') || 
      keywords.includes('advanced') ||
      keywords.includes('phd') || 
      keywords.includes('doctorate') ||
      keywords.includes('master') ||
      keywords.includes('graduate')) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.EXPERT;
  }
  
  // University/College level  
  if (keywords.includes('university') || 
      keywords.includes('college') ||
      keywords.includes('bachelor') ||
      keywords.includes('undergraduate')) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.UNIVERSITY;
  }
  
  // High school level
  if (keywords.includes('high school') || 
      keywords.includes('secondary') ||
      keywords.includes('advanced') ||
      keywords.includes('intermediate')) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.HIGH_SCHOOL;
  }
  
  // Elementary/Beginner level
  if (keywords.includes('elementary') || 
      keywords.includes('beginner') || 
      keywords.includes('basic') ||
      keywords.includes('simple') ||
      keywords.includes('easy')) {
    return CUSTOM_DIFFICULTY_MULTIPLIERS.ELEMENTARY;
  }
  
  // Default for custom difficulties without clear indicators
  return 1.3;
};

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

export const validateCustomDifficultyText = (text: string): { 
  isValid: boolean; 
  error?: string; 
  suggestions?: string[] 
} => {
  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a difficulty description',
      suggestions: ['Example: "university level physics"']
    };
  }
  
  if (trimmedText.length < VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Description must be at least ${VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MIN_LENGTH} characters long`,
      suggestions: ['Be more specific about the difficulty level']
    };
  }
  
  if (trimmedText.length > VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Description must be less than ${VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MAX_LENGTH} characters`,
      suggestions: ['Try to be more concise']
    };
  }

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

export const formatDifficultyForStorage = (difficulty: string): string => {
  return difficulty.trim();
};

export const compareDifficulties = (diff1: string, diff2: string): boolean => {
  return formatDifficultyForStorage(diff1) === formatDifficultyForStorage(diff2);
};

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
