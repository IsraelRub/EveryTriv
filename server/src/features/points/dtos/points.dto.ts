/**
 * Points DTOs
 *
 * @module PointsDTOs
 * @description Data Transfer Objects for points management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { GameMode, VALID_GAME_MODES } from '@shared/constants';

export class DeductPointsDto {
	@ApiProperty({
		description: 'Number of questions in the game',
		example: 5,
		minimum: 1,
		maximum: 20,
	})
	@IsNumber({}, { message: 'Question count must be a number' })
	@Min(1, { message: 'Question count must be at least 1' })
	@Max(20, { message: 'Question count cannot exceed 20' })
	questionCount: number;

	@ApiProperty({
		description: 'Game mode',
		example: 'question-limited',
		enum: VALID_GAME_MODES,
	})
	@IsString()
	@IsNotEmpty({ message: 'Game mode is required' })
	@IsIn(VALID_GAME_MODES, {
		message: `Game mode must be one of: ${VALID_GAME_MODES.join(', ')}`,
	})
	gameMode: GameMode;
}

export class PurchasePointsDto {
	@ApiProperty({
		description: 'Package ID for points purchase',
		example: 'package_points',
		minLength: 1,
		maxLength: 50,
	})
	@IsString()
	@IsNotEmpty({ message: 'Package ID is required' })
	@MinLength(1, { message: 'Package ID must be at least 1 character long' })
	@MaxLength(50, { message: 'Package ID cannot exceed 50 characters' })
	packageId: string;
}

export class ConfirmPointPurchaseDto {
	@ApiProperty({
		description: 'Payment intent ID from payment processor',
		example: 'pi_your_payment_intent_id',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty({ message: 'Payment intent ID is required' })
	@MinLength(1, { message: 'Payment intent ID must be at least 1 character long' })
	@MaxLength(100, { message: 'Payment intent ID cannot exceed 100 characters' })
	paymentIntentId: string;

	@ApiProperty({
		description: 'Number of points purchased',
		example: 100,
		minimum: 1,
	})
	@IsNumber({}, { message: 'Points must be a number' })
	@Min(1, { message: 'Points must be at least 1' })
	points: number;
}

export class GetPointHistoryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of transactions to return',
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
}

export class CanPlayDto {
	@ApiProperty({
		description: 'Number of questions to check if user can play',
		example: 5,
		minimum: 1,
		maximum: 20,
	})
	@IsNumber({}, { message: 'Question count must be a number' })
	@Min(1, { message: 'Question count must be at least 1' })
	@Max(20, { message: 'Question count cannot exceed 20' })
	questionCount: number;
}
