/**
 * Analytics Utilities
 *
 * @module AnalyticsUtils
 * @description Utility functions for analytics data creation and transformation
 * @used_by server/src/features/game, server/src/features/analytics
 */
import type { AnalyticsAnswerData, GameDifficulty, QuestionData } from '../../types';

/**
 * Create AnalyticsAnswerData from QuestionData
 * @param questionData Question data with answer information
 * @param topic Optional topic override
 * @param difficulty Optional difficulty override
 * @returns AnalyticsAnswerData object
 */
export function createAnalyticsAnswerData(
	questionData: QuestionData,
	topic?: string,
	difficulty?: GameDifficulty
): AnalyticsAnswerData {
	return {
		isCorrect: questionData.isCorrect,
		timeSpent: questionData.timeSpent ?? 0,
		userAnswer: questionData.userAnswer,
		selectedAnswer: questionData.userAnswer,
		correctAnswer: questionData.correctAnswer,
		topic,
		difficulty,
	};
}
