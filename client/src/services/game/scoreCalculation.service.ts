/**
 * Score Calculation Service
 * @module ScoreCalculationService
 * @description Service for calculating game scores and multipliers
 */
import {
  PointCalculationService,
} from '@shared';

import { TriviaQuestion } from '../../types';


/**
 * Calculate total score for a correct answer using ALGORITHM
 */
export const calculateScore = (
  question: TriviaQuestion,
  _totalTime: number,
  timeSpent: number,
  streak: number = 0,
  isCorrect: boolean = true
): number => {
  // Use the point calculation service
  const pointCalculationService = new PointCalculationService();
  return pointCalculationService.calculateAnswerPoints(
    question.difficulty,
    timeSpent,
    streak,
    isCorrect
  );
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
