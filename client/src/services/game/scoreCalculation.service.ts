/**
 * Score Calculation Service
 * @module ScoreCalculationService
 * @description Service for calculating game scores and multipliers
 */
import {
  CUSTOM_DIFFICULTY_MULTIPLIERS,
  CUSTOM_DIFFICULTY_PREFIX,
  DIFFICULTY_MULTIPLIERS,
  DifficultyLevel,
} from '@shared';

import { TriviaQuestion } from '../../types';

/**
 * Calculate difficulty multiplier for a question
 */
export const calculateDifficultyMultiplier = (question: TriviaQuestion): number => {
  // Check if custom difficulty has metadata with multiplier
  if (
    question.metadata?.customDifficultyMultiplier &&
    typeof question.metadata.customDifficultyMultiplier === 'number'
  ) {
    return question.metadata.customDifficultyMultiplier;
  }

  // Check if it's a custom difficulty (starts with custom:)
  if (question.difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX)) {
    // Extract custom difficulty text and find matching multiplier
    const customText = question.difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length).toLowerCase();

    // Find matching multiplier from CUSTOM_DIFFICULTY_MULTIPLIERS
    for (const [keyword, multiplier] of Object.entries(CUSTOM_DIFFICULTY_MULTIPLIERS)) {
      if (customText.includes(keyword.toLowerCase())) {
        return multiplier as number;
      }
    }

    return 1; // Default custom difficulty multiplier
  }

  // Standard difficulty multipliers
  switch (question.difficulty) {
    case DifficultyLevel.EASY:
      return DIFFICULTY_MULTIPLIERS[DifficultyLevel.EASY] as number;
    case DifficultyLevel.MEDIUM:
      return DIFFICULTY_MULTIPLIERS[DifficultyLevel.MEDIUM] as number;
    case DifficultyLevel.HARD:
      return DIFFICULTY_MULTIPLIERS[DifficultyLevel.HARD] as number;
    default:
      return 1;
  }
};

/**
 * Calculate time bonus multiplier
 */
export const calculateTimeBonus = (totalTime: number, timeSpent: number): number => {
  return 1 + ((totalTime - timeSpent) / totalTime) * 0.5;
};

/**
 * Calculate options multiplier based on number of answer options
 */
export const calculateOptionsMultiplier = (optionsCount: number): number => {
  switch (optionsCount) {
    case 3:
      return 1;
    case 4:
      return 1.2;
    case 5:
      return 1.4;
    default:
      return 1;
  }
};

/**
 * Calculate total score for a correct answer
 */
export const calculateScore = (
  question: TriviaQuestion,
  totalTime: number,
  timeSpent: number,
  basePoints: number = 100
): number => {
  const difficultyMultiplier = calculateDifficultyMultiplier(question);
  const timeBonus = calculateTimeBonus(totalTime, timeSpent);
  const optionsMultiplier = calculateOptionsMultiplier(question.answers.length);

  const totalMultiplier = difficultyMultiplier * timeBonus * optionsMultiplier;
  return Math.round(basePoints * totalMultiplier);
};

/**
 * Update game stats after answering a question
 */
export const updateGameStats = (
  currentStats: {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    totalQuestionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
  },
  isCorrect: boolean
) => {
  const newStats = { ...currentStats };

  if (isCorrect) {
    newStats.correctAnswers += 1;
  }

  newStats.totalQuestionsAnswered += 1;
  newStats.accuracy = (newStats.correctAnswers / newStats.totalQuestionsAnswered) * 100;

  return newStats;
};
