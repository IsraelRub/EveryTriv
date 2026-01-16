// Analytics event-related type definitions.
import {
	AnalyticsAction,
	AnalyticsEnvironment,
	AnalyticsEventType,
	AnalyticsPageName,
	AnalyticsResult,
} from '@shared/constants';

import type { BasicValue } from '../../core/data.types';
import type { BaseAnswerData, BaseGameTopicDifficulty, GameDifficulty } from '../game/trivia.types';

export interface AnalyticsQuestionDetail extends BaseGameTopicDifficulty {
	id: string;
	responseTime: number;
	timestamp: Date;
}

export interface AnalyticsProviderError {
	timestamp: Date;
	provider: string;
}

export interface AnalyticsEventData {
	eventType: AnalyticsEventType;
	userId?: string;
	sessionId?: string;
	timestamp: Date;
	page?: AnalyticsPageName;
	action?: AnalyticsAction;
	result?: AnalyticsResult;
	duration?: number;
	value?: number;
	properties?: Record<string, BasicValue>;
}

export interface AnalyticsMetadata {
	eventType?: AnalyticsEventType;
	sessionId?: string;
	page?: AnalyticsPageName;
	action?: AnalyticsAction;
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

export interface AnalyticsAnswerData extends Partial<BaseAnswerData> {
	topic?: string;
	difficulty?: GameDifficulty;
}

export interface TrackEventResponse {
	success: boolean;
	eventId?: string;
	message?: string;
}
