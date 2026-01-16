import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsDateString,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from 'class-validator';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	AnalyticsResult,
	ComparisonTarget,
	LeaderboardPeriod,
	TimePeriod,
	VALID_LEADERBOARD_PERIODS,
	VALID_TIME_PERIODS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { BasicValue } from '@shared/types';

const VALID_ANALYTICS_RESULTS = Object.values(AnalyticsResult);
const VALID_ANALYTICS_EVENT_TYPES = Object.values(AnalyticsEventType);
const VALID_ANALYTICS_PAGE_NAMES = Object.values(AnalyticsPageName);
const VALID_ANALYTICS_ACTIONS = Object.values(AnalyticsAction);

export class TrackEventDto {
	@ApiProperty({
		description: 'Type of analytics event',
		enum: VALID_ANALYTICS_EVENT_TYPES,
	})
	@IsNotEmpty({ message: 'Event type is required' })
	@IsIn(VALID_ANALYTICS_EVENT_TYPES, {
		message: `Event type must be one of: ${VALID_ANALYTICS_EVENT_TYPES.join(', ')}`,
	})
	eventType: AnalyticsEventType;

	@ApiPropertyOptional({
		description: 'User ID (optional, will be set from authenticated user)',
		example: 'user_your_user_id',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'User ID cannot exceed 100 characters' })
	userId?: string;

	@ApiPropertyOptional({
		description: 'Session ID for tracking user sessions',
		example: 'session_your_session_id',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Session ID cannot exceed 100 characters' })
	sessionId?: string;

	@ApiPropertyOptional({
		description: 'Event timestamp (optional, ISO-8601 string)',
		example: '2024-01-01T00:00:00.000Z',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Timestamp must be a valid ISO date string' })
	timestamp?: string;

	@ApiPropertyOptional({
		description: 'Page or screen where event occurred',
		enum: VALID_ANALYTICS_PAGE_NAMES,
	})
	@IsOptional()
	@IsIn(VALID_ANALYTICS_PAGE_NAMES, {
		message: `Page must be one of: ${VALID_ANALYTICS_PAGE_NAMES.join(', ')}`,
	})
	page?: AnalyticsPageName;

	@ApiPropertyOptional({
		description: 'Action performed by user',
		enum: VALID_ANALYTICS_ACTIONS,
	})
	@IsOptional()
	@IsIn(VALID_ANALYTICS_ACTIONS, {
		message: `Action must be one of: ${VALID_ANALYTICS_ACTIONS.join(', ')}`,
	})
	action?: AnalyticsAction;

	@ApiPropertyOptional({
		description: 'Result of the action',
		enum: VALID_ANALYTICS_RESULTS,
	})
	@IsOptional()
	@IsIn(VALID_ANALYTICS_RESULTS, {
		message: `Result must be one of: ${VALID_ANALYTICS_RESULTS.join(', ')}`,
	})
	result?: AnalyticsResult;

	@ApiPropertyOptional({
		description: 'Duration of the action in milliseconds',
		minimum: 0,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Duration must be a number' })
	duration?: number;

	@ApiPropertyOptional({
		description: 'Numeric value associated with the event',
		example: 100,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Value must be a number' })
	value?: number;

	@ApiPropertyOptional({
		description: 'Additional properties for the event',
		example: { difficulty: 'medium', topic: 'science' },
	})
	@IsOptional()
	@IsObject()
	properties?: Record<string, BasicValue>;
}

export class TopicAnalyticsQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for topic analytics query',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date for topic analytics query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	endDate?: Date;

	@ApiPropertyOptional({
		description: 'Maximum number of topics to return',
		minimum: 1,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}`,
	})
	limit?: number;
}

export class UserIdParamDto {
	@ApiProperty({
		description: 'User ID',
		example: 'f6e8b1a2-1234-4abd-9c1d-5e7f6b8a9c0d',
	})
	@IsString()
	@IsNotEmpty({ message: 'User ID is required' })
	userId!: string;
}

export class UserActivityQueryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of activity entries to return',
		minimum: 1,
		maximum: 200,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(200, { message: 'Limit cannot exceed 200' })
	limit?: number;

	@ApiPropertyOptional({
		description: 'Start date for activity range filter',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date for activity range filter',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	endDate?: Date;
}

export class UserTrendQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for user trend analytics',
		example: '2024-01-01',
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date for user trend analytics',
		example: '2024-05-31',
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	endDate?: Date;

	@ApiPropertyOptional({
		description: 'Group trend data by time period',
		enum: VALID_TIME_PERIODS,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_TIME_PERIODS, {
		message: `Group by must be one of: ${VALID_TIME_PERIODS.join(', ')}`,
	})
	groupBy?: TimePeriod;

	@ApiPropertyOptional({
		description: 'Maximum number of timeline scoring to return',
		minimum: 1,
		maximum: 200,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(200, { message: 'Limit cannot exceed 200' })
	limit?: number;
}

export class UserComparisonQueryDto {
	@ApiPropertyOptional({
		description: 'Comparison target: global averages or another user',
		enum: ComparisonTarget,
	})
	@IsOptional()
	@IsIn(Object.values(ComparisonTarget), {
		message: 'Target must be either global or user',
	})
	target?: ComparisonTarget;

	@ApiPropertyOptional({
		description: 'Target user ID when comparing two users',
		example: 'a7c8b9d0-1234-4def-9abc-5e6f7d8c9b0a',
	})
	@IsOptional()
	@IsString()
	targetUserId?: string;

	@ApiPropertyOptional({
		description: 'Start date for comparison date range filter',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date for comparison date range filter',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	endDate?: Date;
}

export class UserSummaryQueryDto {
	@ApiPropertyOptional({
		description: 'Include full activity history in the summary',
		example: true,
	})
	@IsOptional()
	@Transform(({ value }) => value === true || value === 'true')
	@IsBoolean({ message: 'includeActivity must be a boolean value' })
	includeActivity?: boolean;
}

export class GetLeaderboardDto {
	@ApiPropertyOptional({
		description: 'Leaderboard type',
		enum: VALID_LEADERBOARD_PERIODS,
		default: LeaderboardPeriod.GLOBAL,
	})
	@IsString()
	@IsIn(VALID_LEADERBOARD_PERIODS, {
		message: `Type must be one of: ${VALID_LEADERBOARD_PERIODS.join(', ')}`,
	})
	type: LeaderboardPeriod = LeaderboardPeriod.GLOBAL;

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;

	@ApiPropertyOptional({
		description: 'Maximum number of entries to return',
		minimum: 1,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
		default: 50,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}`,
	})
	limit: number = 50;

	@ApiPropertyOptional({
		description: 'Starting position for pagination',
		minimum: 0,
		default: 0,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Offset must be a number' })
	@Min(0, { message: 'Offset must be at least 0' })
	offset: number = 0;
}

export class GetLeaderboardStatsDto {
	@ApiPropertyOptional({
		description: 'Time period for statistics',
		enum: VALID_LEADERBOARD_PERIODS,
		default: LeaderboardPeriod.WEEKLY,
	})
	@IsString()
	@IsIn(VALID_LEADERBOARD_PERIODS, {
		message: `Period must be one of: ${VALID_LEADERBOARD_PERIODS.join(', ')}`,
	})
	period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY;
}
