/**
 * Leaderboard DTOs
 *
 * @module LeaderboardDTOs
 * @description Data Transfer Objects for leaderboard management
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { LeaderboardPeriod, VALID_LEADERBOARD_PERIODS, VALIDATION_COUNT } from '@shared/constants';

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
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, { message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}` })
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
