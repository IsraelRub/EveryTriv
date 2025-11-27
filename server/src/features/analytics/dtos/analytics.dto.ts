/**
 * Analytics DTOs
 *
 * @module AnalyticsDTOs
 * @description Data Transfer Objects for analytics tracking and queries
 */
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
	MinLength,
} from 'class-validator';

import {
	EventResult,
	SortOrder,
	TimePeriod,
	VALID_EVENT_RESULTS,
	VALID_SORT_ORDERS,
	VALID_TIME_PERIODS,
} from '@shared/constants';
import { BasicValue } from '@shared/types';

export class TrackEventDto {
	@ApiProperty({
		description: 'Type of analytics event',
		example: 'game_started',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty({ message: 'Event type is required' })
	@MinLength(1, { message: 'Event type must be at least 1 character long' })
	@MaxLength(100, { message: 'Event type cannot exceed 100 characters' })
	eventType: string;

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
		description: 'Event timestamp (optional, will be set automatically)',
		example: '2024-01-01T00:00:00.000Z',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Timestamp must be a valid date' })
	timestamp?: Date;

	@ApiPropertyOptional({
		description: 'Page or screen where event occurred',
		example: '/game/trivia',
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Page cannot exceed 200 characters' })
	page?: string;

	@ApiPropertyOptional({
		description: 'Action performed by user',
		example: 'click',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Action cannot exceed 100 characters' })
	action?: string;

	@ApiPropertyOptional({
		description: 'Result of the action',
		example: 'success',
		enum: VALID_EVENT_RESULTS,
	})
	@IsOptional()
	@IsIn(VALID_EVENT_RESULTS, {
		message: `Result must be one of: ${VALID_EVENT_RESULTS.join(', ')}`,
	})
	result?: EventResult;

	@ApiPropertyOptional({
		description: 'Duration of the action in milliseconds',
		example: 1500,
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
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for topic analytics query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Maximum number of topics to return',
		example: 20,
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	limit?: number;

	@ApiPropertyOptional({
		description: 'Sort order for topics',
		example: 'desc',
		enum: VALID_SORT_ORDERS,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_SORT_ORDERS, {
		message: `Order must be one of: ${VALID_SORT_ORDERS.join(', ')}`,
	})
	order?: SortOrder;
}

export class DifficultyAnalyticsQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for difficulty analytics query',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for difficulty analytics query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Include custom difficulties in results',
		example: true,
	})
	@IsOptional()
	@Transform(({ value }) => value === true || value === 'true')
	@IsBoolean({ message: 'Include custom difficulties must be a boolean value' })
	includeCustom?: boolean;

	@ApiPropertyOptional({
		description: 'Group results by time period',
		example: 'daily',
		enum: VALID_TIME_PERIODS,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_TIME_PERIODS, {
		message: `Group by must be one of: ${VALID_TIME_PERIODS.join(', ')}`,
	})
	groupBy?: TimePeriod;
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
		example: 25,
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
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for activity range filter',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;
}

export class UserTrendQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for user trend analytics',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for user trend analytics',
		example: '2024-05-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Group trend data by time period',
		example: 'weekly',
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
		example: 30,
		minimum: 1,
		maximum: 200,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	limit?: number;
}

export class UserComparisonQueryDto {
	@ApiPropertyOptional({
		description: 'Comparison target: global averages or another user',
		example: 'global',
		enum: ['global', 'user'],
	})
	@IsOptional()
	@IsIn(['global', 'user'], { message: 'Target must be either global or user' })
	target?: 'global' | 'user';

	@ApiPropertyOptional({
		description: 'Target user ID when comparing two users',
		example: 'a7c8b9d0-1234-4def-9abc-5e6f7d8c9b0a',
	})
	@IsOptional()
	@IsString()
	targetUserId?: string;
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
