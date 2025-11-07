/**
 * Leaderboard DTOs
 *
 * @module LeaderboardDTOs
 * @description Data Transfer Objects for leaderboard management
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { LeaderboardPeriod, SortOrder, VALID_LEADERBOARD_PERIODS, VALID_SORT_ORDERS } from '@shared/constants';

export class GetLeaderboardDto {
	@ApiPropertyOptional({
		description: 'Leaderboard type',
		example: 'global',
		enum: VALID_LEADERBOARD_PERIODS,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_LEADERBOARD_PERIODS, {
		message: `Type must be one of: ${VALID_LEADERBOARD_PERIODS.join(', ')}`,
	})
	type?: LeaderboardPeriod = LeaderboardPeriod.GLOBAL;

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
	@Transform(({ value }) => parseInt(value, 10))
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
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Offset must be a number' })
	@Min(0, { message: 'Offset must be at least 0' })
	offset?: number = 0;

	@ApiPropertyOptional({
		description: 'Sort order',
		example: 'desc',
		enum: VALID_SORT_ORDERS,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_SORT_ORDERS, {
		message: `Order must be one of: ${VALID_SORT_ORDERS.join(', ')}`,
	})
	order?: SortOrder = SortOrder.DESC;
}
