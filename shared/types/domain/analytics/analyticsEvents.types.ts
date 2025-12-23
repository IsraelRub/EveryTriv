/**
 * Analytics event-related type definitions
 *
 * @module AnalyticsEventTypes
 * @description Structures for tracking analytics events, metadata, and answer-level telemetry
 */
import { AnalyticsEnvironment, AnalyticsResult } from '@shared/constants';

import type { BasicValue } from '../../core/data.types';
import type { BaseGameTopicDifficulty, GameDifficulty } from '../game/trivia.types';

/**
 * Provider-specific question metadata captured for analytics
 */
export interface AnalyticsQuestionDetail extends BaseGameTopicDifficulty {
	id: string;
	responseTime: number;
	timestamp: Date;
}

/**
 * Provider error metadata captured alongside analytics events
 */
export interface AnalyticsProviderError {
	timestamp: Date;
	provider: string;
}

/**
 * Analytics event data structure
 */
export interface AnalyticsEventData {
	eventType: string;
	userId?: string;
	sessionId?: string;
	timestamp: Date;
	page?: string;
	action?: string;
	result?: AnalyticsResult;
	duration?: number;
	value?: number;
	properties?: Record<string, BasicValue>;
}

/**
 * Analytics event metadata
 */
export interface AnalyticsMetadata {
	eventType?: string;
	sessionId?: string;
	page?: string;
	action?: string;
	result?: AnalyticsResult;
	duration?: number;
	value?: number;
	environment?: AnalyticsEnvironment;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	questions?: AnalyticsQuestionDetail[];
	errors?: AnalyticsProviderError[];
}

/**
 * Analytics answer data structure
 */
export interface AnalyticsAnswerData {
	isCorrect: boolean;
	timeSpent: number;
	topic?: string;
	difficulty?: GameDifficulty;
	selectedAnswer?: string;
	correctAnswer?: string;
	userAnswer?: string;
}

/**
 * Track event response interface
 * @interface TrackEventResponse
 * @description Response from tracking an analytics event
 */
export interface TrackEventResponse {
	success: boolean;
	eventId?: string;
	message?: string;
}
