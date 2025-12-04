/**
 * Credits DTOs
 *
 * @module CreditsDTOs
 * @description Data Transfer Objects for credits management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
} from 'class-validator';

import { GameMode, VALID_GAME_MODES, VALIDATION_LIMITS } from '@shared/constants';

import { PaymentMethodDetailsDto } from '../../payment/dtos';

export class DeductCreditsDto {
	@ApiProperty({
		description:
			'Number of questions per request (-1 for unlimited mode). ' +
			'BREAKING CHANGE: The "amount" alias has been removed. Use "questionsPerRequest" only. ' +
			'See VALIDATION_LIMITS.QUESTIONS.UNLIMITED for explanation of why -1 is used instead of Infinity or a string.',
		example: 5,
		minimum: VALIDATION_LIMITS.QUESTIONS.MIN,
		maximum: VALIDATION_LIMITS.QUESTIONS.UNLIMITED,
	})
	@IsNotEmpty({ message: 'Questions per request is required' })
	@Transform(({ value }) => {
		if (value === undefined || value === null) {
			return undefined;
		}
		// If already a number, return as-is (validate it's integer)
		if (typeof value === 'number') {
			return Number.isInteger(value) ? value : Math.floor(value);
		}
		// If string, parse it
		if (typeof value === 'string') {
			const parsed = parseInt(value, 10);
			return Number.isNaN(parsed) ? undefined : parsed;
		}
		return undefined;
	})
	@IsNumber({}, { message: 'Questions per request must be a number' })
	@Min(VALIDATION_LIMITS.QUESTIONS.MIN, {
		message: `Questions per request must be at least ${VALIDATION_LIMITS.QUESTIONS.MIN}`,
	})
	@ValidateIf((o: DeductCreditsDto) => o.questionsPerRequest !== VALIDATION_LIMITS.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_LIMITS.QUESTIONS.MAX, {
		message: `Questions per request cannot exceed ${VALIDATION_LIMITS.QUESTIONS.MAX} (use ${VALIDATION_LIMITS.QUESTIONS.UNLIMITED} for unlimited mode)`,
	})
	questionsPerRequest: number;

	@ApiProperty({
		description:
			'Game mode for the deduction. ' + 'BREAKING CHANGE: The "gameType" alias has been removed. Use "gameMode" only.',
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
		description: 'Reason for deduction (for logging purposes)',
		example: 'Game play',
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
	reason?: string;
}

export class PurchaseCreditsDto extends PaymentMethodDetailsDto {
	@ApiProperty({
		description: 'Package ID for credits purchase',
		example: 'package_credits',
		minLength: 1,
		maxLength: 50,
	})
	@IsString()
	@IsNotEmpty({ message: 'Package ID is required' })
	@MinLength(1, { message: 'Package ID must be at least 1 character long' })
	@MaxLength(50, { message: 'Package ID cannot exceed 50 characters' })
	packageId: string;
}

export class ConfirmCreditPurchaseDto {
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
		description: 'Number of credits purchased',
		example: 100,
		minimum: 1,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Credits must be a number' })
	@Min(1, { message: 'Credits must be at least 1' })
	credits: number;
}

export class GetCreditHistoryDto {
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
		description: 'Number of questions per request to check if user can play',
		example: 5,
		minimum: VALIDATION_LIMITS.QUESTIONS.MIN,
		maximum: VALIDATION_LIMITS.QUESTIONS.UNLIMITED,
	})
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
	@IsNumber({}, { message: 'Questions per request must be a number' })
	@Min(VALIDATION_LIMITS.QUESTIONS.MIN, {
		message: `Questions per request must be at least ${VALIDATION_LIMITS.QUESTIONS.MIN}`,
	})
	@ValidateIf((o: CanPlayDto) => o.questionsPerRequest !== VALIDATION_LIMITS.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_LIMITS.QUESTIONS.MAX, {
		message: `Questions per request cannot exceed ${VALIDATION_LIMITS.QUESTIONS.MAX} (use ${VALIDATION_LIMITS.QUESTIONS.UNLIMITED} for unlimited mode)`,
	})
	questionsPerRequest?: number;

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
