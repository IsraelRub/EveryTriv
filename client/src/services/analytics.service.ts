/**
 * Client-side Analytics Service
 *
 * @module ClientAnalyticsService
 * @description Local analytics service for calculating statistics from current game data
 * @used_by client/src/views, client/src/components
 */

import type { QuestionData } from '@shared/types';
import { calculatePercentage } from '@shared/utils';

import type { CurrentGameStats } from '@/types/services/analytics.types';

import { calculateAverage } from '../utils';

/**
 * Client-side analytics service for local calculations
 */
export class AnalyticsService {
	/**
	 * Calculate statistics from current game session
	 * @param questionsData Array of question data from current game
	 * @param totalScore Total score achieved
	 * @param totalTime Total time spent in seconds
	 * @returns Current game statistics
	 */
	calculateGameSessionStats(questionsData: QuestionData[], totalScore: number, totalTime: number): CurrentGameStats {
		const correctAnswers = questionsData.filter(q => q.isCorrect).length;
		const totalQuestionsAnswered = questionsData.length;
		const successRate = calculatePercentage(correctAnswers, totalQuestionsAnswered);
		const timeSpentArray = questionsData.map(q => q.timeSpent).filter((t): t is number => t !== undefined && t > 0);
		const averageTimePerQuestion = calculateAverage(timeSpentArray, 1);

		return {
			score: totalScore,
			correctAnswers,
			totalQuestionsAnswered,
			successRate,
			averageTimePerQuestion,
			totalTime,
			questionsData,
		};
	}
}

// Create singleton instance
export const analyticsService = new AnalyticsService();
