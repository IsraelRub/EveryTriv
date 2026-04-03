import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min,
	ValidateIf,
} from 'class-validator';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	AnalyticsResult,
	ComparisonTarget,
	DEFAULT_GAME_CONFIG,
	LeaderboardPeriod,
	TimePeriod,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { BasicValue } from '@shared/types';

export class TrackEventDto {
	@ApiProperty({
		description: 'Type of analytics event',
		enum: AnalyticsEventType,
	})
	@IsNotEmpty({ message: 'Event type is required' })
	@IsEnum(AnalyticsEventType, { message: 'Event type must be a valid AnalyticsEventType' })
	eventType!: AnalyticsEventType;

	@ApiPropertyOptional({
		description: 'User ID (optional, will be set from authenticated user)',
		example: 'user_your_user_id',
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.IDENTIFIER.MAX, {
		message: `User ID cannot exceed ${VALIDATION_LENGTH.IDENTIFIER.MAX} characters`,
	})
	userId?: string;

	@ApiPropertyOptional({
		description: 'Session ID for tracking user sessions',
		example: 'session_your_session_id',
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.IDENTIFIER.MAX, {
		message: `Session ID cannot exceed ${VALIDATION_LENGTH.IDENTIFIER.MAX} characters`,
	})
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
		enum: AnalyticsPageName,
	})
	@IsOptional()
	@IsEnum(AnalyticsPageName, { message: 'Page must be a valid AnalyticsPageName' })
	page?: AnalyticsPageName;

	@ApiPropertyOptional({
		description: 'Action performed by user',
		enum: AnalyticsAction,
	})
	@IsOptional()
	@IsEnum(AnalyticsAction, { message: 'Action must be a valid AnalyticsAction' })
	action?: AnalyticsAction;

	@ApiPropertyOptional({
		description: 'Result of the action',
		enum: AnalyticsResult,
	})
	@IsOptional()
	@IsEnum(AnalyticsResult, { message: 'Result must be a valid AnalyticsResult' })
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
		example: { difficulty: DEFAULT_GAME_CONFIG.defaultDifficulty, topic: DEFAULT_GAME_CONFIG.defaultTopic },
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
		minimum: VALIDATION_COUNT.LEADERBOARD.MIN,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(VALIDATION_COUNT.LEADERBOARD.MIN, {
		message: `Limit must be at least ${VALIDATION_COUNT.LEADERBOARD.MIN}`,
	})
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}`,
	})
	limit?: number;
}

export class UserIdParamDto {
	@ApiProperty({
		description: 'User ID (UUID)',
		example: 'f6e8b1a2-1234-4abd-9c1d-5e7f6b8a9c0d',
	})
	@IsString()
	@IsNotEmpty({ message: 'User ID is required' })
	@IsUUID('4', { message: 'User ID must be a valid UUID' })
	userId!: string;
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
		enum: TimePeriod,
	})
	@IsOptional()
	@IsEnum(TimePeriod, { message: 'Group by must be a valid TimePeriod' })
	groupBy?: TimePeriod;

	@ApiPropertyOptional({
		description: 'Maximum number of timeline scoring to return',
		minimum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN,
		maximum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN, {
		message: `Limit must be at least ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN}`,
	})
	@Max(VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX}`,
	})
	limit?: number;
}

export class UserComparisonQueryDto {
	@ApiPropertyOptional({
		description: 'Comparison target: global averages or another user',
		enum: ComparisonTarget,
	})
	@IsOptional()
	@IsEnum(ComparisonTarget, { message: 'Target must be either global or user' })
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
		enum: LeaderboardPeriod,
		default: LeaderboardPeriod.GLOBAL,
	})
	@IsEnum(LeaderboardPeriod, { message: 'Type must be a valid LeaderboardPeriod' })
	type: LeaderboardPeriod = LeaderboardPeriod.GLOBAL;

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		maxLength: VALIDATION_LENGTH.TOPIC.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.TOPIC.MAX, {
		message: `Topic cannot exceed ${VALIDATION_LENGTH.TOPIC.MAX} characters`,
	})
	topic?: string;

	@ApiPropertyOptional({
		description: 'Maximum number of entries to return',
		minimum: VALIDATION_COUNT.LEADERBOARD.MIN,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
		default: 50,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(VALIDATION_COUNT.LEADERBOARD.MIN, {
		message: `Limit must be at least ${VALIDATION_COUNT.LEADERBOARD.MIN}`,
	})
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
		enum: LeaderboardPeriod,
		default: LeaderboardPeriod.WEEKLY,
	})
	@IsEnum(LeaderboardPeriod, { message: 'Period must be a valid LeaderboardPeriod' })
	period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY;
}

export class UnifiedUserAnalyticsQueryDto {
	@ApiPropertyOptional({
		description: 'Comma-separated list of analytics sections to include',
		example: 'statistics,performance,insights,recommendations,summary,trends,activity,progress',
	})
	@IsOptional()
	@IsString()
	include?: string;

	@ApiPropertyOptional({
		description: 'Start date for date range filter',
		example: '2024-01-01',
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@IsDate({ message: 'Start date must be a valid date' })
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date for date range filter',
		example: '2024-12-31',
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@IsDate({ message: 'End date must be a valid date' })
	endDate?: Date;

	@ApiPropertyOptional({
		description: 'Group trend data by time period',
		enum: TimePeriod,
	})
	@IsOptional()
	@IsEnum(TimePeriod, { message: 'Group by must be a valid TimePeriod' })
	groupBy?: TimePeriod;

	@ApiPropertyOptional({
		description: 'Maximum number of activity entries to return',
		minimum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN,
		maximum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Activity limit must be a number' })
	@Min(VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN, {
		message: `Activity limit must be at least ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN}`,
	})
	@Max(VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX, {
		message: `Activity limit cannot exceed ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX}`,
	})
	activityLimit?: number;

	@ApiPropertyOptional({
		description: 'Maximum number of trend points to return',
		minimum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN,
		maximum: VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Trend limit must be a number' })
	@Min(VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN, {
		message: `Trend limit must be at least ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN}`,
	})
	@Max(VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX, {
		message: `Trend limit cannot exceed ${VALIDATION_COUNT.ACTIVITY_ENTRIES.MAX}`,
	})
	trendLimit?: number;

	@ApiPropertyOptional({
		description: 'Include full activity history in summary',
		example: false,
	})
	@IsOptional()
	@Transform(({ value }) => value === true || value === 'true')
	@IsBoolean({ message: 'includeActivity must be a boolean value' })
	includeActivity?: boolean;

	@ApiPropertyOptional({
		description: 'Target user ID for comparison (when include=comparison)',
		example: 'a7c8b9d0-1234-4def-9abc-5e6f7d8c9b0a',
	})
	@IsOptional()
	@ValidateIf((obj, v) => obj != null && v !== '' && v != null)
	@IsString()
	targetUserId?: string;

	@ApiPropertyOptional({
		description: 'Comparison target: global averages or another user',
		enum: ComparisonTarget,
	})
	@IsOptional()
	@ValidateIf((obj, v) => obj != null && v !== '' && v != null)
	@IsEnum(ComparisonTarget, { message: 'Target must be either global or user' })
	comparisonTarget?: ComparisonTarget;
}
