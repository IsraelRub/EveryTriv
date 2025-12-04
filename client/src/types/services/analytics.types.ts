/**
 * Analytics Service Types
 * @module AnalyticsServiceTypes
 * @description Type definitions for analytics service
 */
import type { QuestionData } from '@shared/types';

/**
 * Current game statistics interface
 * @interface CurrentGameStats
 * @description Statistics for a single completed game session
 */
export interface CurrentGameStats {
	score: number;
	correctAnswers: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageTimePerQuestion: number;
	totalTime: number;
	questionsData: QuestionData[];
}
