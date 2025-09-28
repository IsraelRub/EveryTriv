/**
 * Analytics DTOs
 *
 * @module AnalyticsDTOs
 * @description Data Transfer Objects for analytics tracking and queries
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasicValue } from '@shared';
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
	MaxLength,
	MinLength,
} from 'class-validator';

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
		enum: ['success', 'failure', 'error'],
	})
	@IsOptional()
	@IsIn(['success', 'failure', 'error'], {
		message: 'Result must be one of: success, failure, error',
	})
	result?: 'success' | 'failure' | 'error';

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

export class UserAnalyticsQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for analytics query',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for analytics query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Include game history in results',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Include game history must be a boolean value' })
	includeGameHistory?: boolean;

	@ApiPropertyOptional({
		description: 'Include performance metrics in results',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Include performance must be a boolean value' })
	includePerformance?: boolean;

	@ApiPropertyOptional({
		description: 'Include topic breakdown in results',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Include topic breakdown must be a boolean value' })
	includeTopicBreakdown?: boolean;
}

export class GameAnalyticsQueryDto {
	@ApiPropertyOptional({
		description: 'Start date for game analytics query',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for game analytics query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Filter by specific topic',
		example: 'science',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;

	@ApiPropertyOptional({
		description: 'Filter by difficulty level',
		example: 'medium',
		enum: ['easy', 'medium', 'hard', 'expert'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['easy', 'medium', 'hard', 'expert'], {
		message: 'Difficulty must be one of: easy, medium, hard, expert',
	})
	difficulty?: string;

	@ApiPropertyOptional({
		description: 'Filter by game mode',
		example: 'classic',
		enum: ['classic', 'timed', 'survival', 'multiplayer'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['classic', 'timed', 'survival', 'multiplayer'], {
		message: 'Game mode must be one of: classic, timed, survival, multiplayer',
	})
	gameMode?: string;

	@ApiPropertyOptional({
		description: 'Maximum number of results to return',
		example: 100,
		minimum: 1,
		maximum: 1000,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	limit?: number;
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
		enum: ['asc', 'desc'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['asc', 'desc'], {
		message: 'Order must be either asc or desc',
	})
	order?: 'asc' | 'desc';
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
	@IsBoolean({ message: 'Include custom difficulties must be a boolean value' })
	includeCustom?: boolean;

	@ApiPropertyOptional({
		description: 'Group results by time period',
		example: 'daily',
		enum: ['hourly', 'daily', 'weekly', 'monthly'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['hourly', 'daily', 'weekly', 'monthly'], {
		message: 'Group by must be one of: hourly, daily, weekly, monthly',
	})
	groupBy?: string;
}
