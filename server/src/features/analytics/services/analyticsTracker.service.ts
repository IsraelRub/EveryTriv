import { Injectable } from '@nestjs/common';

import { CACHE_KEYS, TIME_DURATIONS_SECONDS, VALIDATION_COUNT } from '@shared/constants';
import type { AnalyticsEventData, TrackEventResponse } from '@shared/types';
import { getErrorMessage, isStringArray } from '@shared/utils';

import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class AnalyticsTrackerService {
	constructor(private readonly cacheService: CacheService) {}

	async trackEvent(eventData: AnalyticsEventData): Promise<TrackEventResponse> {
		try {
			const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			const cacheKey = CACHE_KEYS.ANALYTICS.EVENT(eventData.userId ?? 'anonymous', eventId);

			await this.cacheService.set(cacheKey, eventData, TIME_DURATIONS_SECONDS.MONTH);

			if (eventData.userId != null) {
				const userEventsKey = CACHE_KEYS.ANALYTICS.USER_EVENTS(eventData.userId);
				const existingEventsResult = await this.cacheService.get<string[]>(userEventsKey, isStringArray);
				const eventsList =
					existingEventsResult.success && existingEventsResult.data != null ? existingEventsResult.data : [];
				eventsList.push(eventId);
				if (eventsList.length > VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX) {
					eventsList.shift();
				}
				await this.cacheService.set(userEventsKey, eventsList, TIME_DURATIONS_SECONDS.MONTH);
			}

			logger.analyticsStats('Analytics event tracked', {
				eventType: eventData.eventType,
				userId: eventData.userId,
			});

			return { success: true, eventId };
		} catch (error) {
			logger.analyticsError('Failed to track analytics event', {
				errorInfo: { message: getErrorMessage(error) },
				eventType: eventData.eventType,
				userId: eventData.userId,
			});
			throw error;
		}
	}
}
