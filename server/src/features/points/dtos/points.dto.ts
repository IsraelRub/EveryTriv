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
	@ApiPropertyOptional({
		description: 'Number of questions to deduct points for',
		example: 5,
		minimum: 1,
		maximum: 50,
	})
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
	@IsNumber({}, { message: 'Question count must be a number' })
	@Min(1, { message: 'Question count must be at least 1' })
	@Max(50, { message: 'Question count cannot exceed 50' })
	questionCount?: number;

	@ApiPropertyOptional({
		description: 'Alias for questionCount. Used for backwards compatibility with older clients.',
		example: 5,
		minimum: 1,
		maximum: 50,
	})
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(1, { message: 'Amount must be at least 1' })
	@Max(50, { message: 'Amount cannot exceed 50' })
	amount?: number;

	@ApiPropertyOptional({
		description: 'Game mode for the deduction',
		example: 'question-limited',
		enum: VALID_GAME_MODES,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_GAME_MODES, {
		message: `Game mode must be one of: ${VALID_GAME_MODES.join(', ')}`,
	})
	gameMode?: GameMode;

	@ApiPropertyOptional({
		description: 'Alias for gameMode used by older clients',
		example: 'question-limited',
		enum: VALID_GAME_MODES,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_GAME_MODES, {
		message: `Game type must be one of: ${VALID_GAME_MODES.join(', ')}`,
	})
	gameType?: GameMode;

	@ApiPropertyOptional({
		description: 'Reason for deduction (for logging purposes)',
		example: 'Game play',
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
	reason?: string;
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
	@ApiPropertyOptional({
		description: 'Payment intent ID from payment processor',
		example: 'pi_your_payment_intent_id',
		minLength: 1,
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MinLength(1, { message: 'Payment intent ID must be at least 1 character long' })
	@MaxLength(100, { message: 'Payment intent ID cannot exceed 100 characters' })
	paymentIntentId?: string;

	@ApiPropertyOptional({
		description: 'Transaction identifier (alias for paymentIntentId)',
		example: 'tx_123456',
		minLength: 1,
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MinLength(1, { message: 'Transaction ID must be at least 1 character long' })
	@MaxLength(100, { message: 'Transaction ID cannot exceed 100 characters' })
	transactionId?: string;

	@ApiPropertyOptional({
		description: 'Payment identifier returned from payment provider',
		example: 'pay_789012',
		minLength: 1,
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MinLength(1, { message: 'Payment ID must be at least 1 character long' })
	@MaxLength(100, { message: 'Payment ID cannot exceed 100 characters' })
	paymentId?: string;

	@ApiProperty({
		description: 'Number of points purchased',
		example: 100,
		minimum: 1,
	})
	@Transform(({ value }) => parseInt(value, 10))
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
	@ApiPropertyOptional({
		description: 'Number of questions to check if user can play',
		example: 5,
		minimum: 1,
		maximum: 20,
	})
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
	@IsNumber({}, { message: 'Question count must be a number' })
	@Min(1, { message: 'Question count must be at least 1' })
	@Max(20, { message: 'Question count cannot exceed 20' })
	questionCount?: number;

	@ApiPropertyOptional({
		description: 'Game mode to evaluate (optional)',
		example: 'question-limited',
		enum: VALID_GAME_MODES,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_GAME_MODES, {
		message: `Game mode must be one of: ${VALID_GAME_MODES.join(', ')}`,
	})
	gameMode?: GameMode;
}
