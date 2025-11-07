/**
 * Score Calculation Service
 * @module ScoreCalculationService
 * @description Service for calculating game scores and multipliers
 */
import { TriviaQuestion } from '@shared/types';
import { calculateAnswerPoints } from '@shared/utils';

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
	return calculateAnswerPoints(question.difficulty, timeSpent, streak, isCorrect);
};
