/**
 * Analytics Service Types
 * @module AnalyticsServiceTypes
 * @description Type definitions for analytics service and UI components
 */
import type { QuestionData } from '@shared/types';

/**
 * Current game statistics interface
 * @interface CurrentGameStats
 * @description Statistics for a single completed game session
 * @used_by client/src/services/analytics.service.ts
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
