/**
 * Leaderboard DTOs
 *
 * @module LeaderboardDTOs
 * @description Data Transfer Objects for leaderboard management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';

export class GetLeaderboardDto {
	@ApiPropertyOptional({
		description: 'Leaderboard type',
		example: 'global',
		enum: ['global', 'weekly', 'monthly', 'yearly', 'topic'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['global', 'weekly', 'monthly', 'yearly', 'topic'], {
		message: 'Type must be one of: global, weekly, monthly, yearly, topic',
	})
	type?: 'global' | 'weekly' | 'monthly' | 'yearly' | 'topic' = 'global';

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		example: 'science',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;

	@ApiPropertyOptional({
		description: 'Maximum number of entries to return',
		example: 50,
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(100, { message: 'Limit cannot exceed 100' })
	limit?: number = 50;

	@ApiPropertyOptional({
		description: 'Starting position for pagination',
		example: 0,
		minimum: 0,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Offset must be a number' })
	@Min(0, { message: 'Offset must be at least 0' })
	offset?: number = 0;

	@ApiPropertyOptional({
		description: 'Sort order',
		example: 'desc',
		enum: ['asc', 'desc'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['asc', 'desc'], {
		message: 'Order must be either asc or desc',
	})
	order?: 'asc' | 'desc' = 'desc';
}

export class GetUserRankDto {
	@ApiProperty({
		description: 'User ID to get rank for',
		example: 'user_your_user_id',
	})
	@IsString()
	@IsNotEmpty({ message: 'User ID is required' })
	@MinLength(1, { message: 'User ID must be at least 1 character long' })
	@MaxLength(100, { message: 'User ID cannot exceed 100 characters' })
	userId: string;

	@ApiPropertyOptional({
		description: 'Leaderboard type',
		example: 'global',
		enum: ['global', 'weekly', 'monthly', 'yearly', 'topic'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['global', 'weekly', 'monthly', 'yearly', 'topic'], {
		message: 'Type must be one of: global, weekly, monthly, yearly, topic',
	})
	type?: 'global' | 'weekly' | 'monthly' | 'yearly' | 'topic' = 'global';

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		example: 'science',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;
}

export class GetLeaderboardStatsDto {
	@ApiPropertyOptional({
		description: 'Leaderboard type',
		example: 'global',
		enum: ['global', 'weekly', 'monthly', 'yearly', 'topic'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['global', 'weekly', 'monthly', 'yearly', 'topic'], {
		message: 'Type must be one of: global, weekly, monthly, yearly, topic',
	})
	type?: 'global' | 'weekly' | 'monthly' | 'yearly' | 'topic' = 'global';

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		example: 'science',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;

	@ApiPropertyOptional({
		description: 'Start date for statistics',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for statistics',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;
}

export class UpdateLeaderboardDto {
	@ApiProperty({
		description: 'User ID',
		example: 'user_your_user_id',
	})
	@IsString()
	@IsNotEmpty({ message: 'User ID is required' })
	@MinLength(1, { message: 'User ID must be at least 1 character long' })
	@MaxLength(100, { message: 'User ID cannot exceed 100 characters' })
	userId: string;

	@ApiProperty({
		description: 'Score to add',
		example: 100,
		minimum: 0,
	})
	@IsNumber({}, { message: 'Score must be a number' })
	@Min(0, { message: 'Score must be at least 0' })
	score: number;

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		example: 'science',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;

	@ApiPropertyOptional({
		description: 'Game mode',
		example: 'classic',
		enum: ['classic', 'timed', 'survival', 'multiplayer'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['classic', 'timed', 'survival', 'multiplayer'], {
		message: 'Game mode must be one of: classic, timed, survival, multiplayer',
	})
	gameMode?: string;
}

export class GetTopPlayersDto {
	@ApiPropertyOptional({
		description: 'Number of top players to return',
		example: 10,
		minimum: 1,
		maximum: 50,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Count must be a number' })
	@Min(1, { message: 'Count must be at least 1' })
	@Max(50, { message: 'Count cannot exceed 50' })
	count?: number = 10;

	@ApiPropertyOptional({
		description: 'Leaderboard type',
		example: 'weekly',
		enum: ['global', 'weekly', 'monthly', 'yearly', 'topic'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['global', 'weekly', 'monthly', 'yearly', 'topic'], {
		message: 'Type must be one of: global, weekly, monthly, yearly, topic',
	})
	type?: 'global' | 'weekly' | 'monthly' | 'yearly' | 'topic' = 'weekly';

	@ApiPropertyOptional({
		description: 'Topic for topic-specific leaderboard',
		example: 'history',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Topic cannot exceed 100 characters' })
	topic?: string;
}
