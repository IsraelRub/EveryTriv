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

import { GameMode, VALID_GAME_MODES, VALIDATION_COUNT, VALIDATION_LENGTH } from '@shared/constants';

import { PaymentMethodDetailsDto } from '../../payment/dtos';

export class DeductCreditsDto {
	@ApiProperty({
		description:
			'Number of questions per request (-1 for unlimited mode) or time in seconds for TIME_LIMITED mode. ' +
			'BREAKING CHANGE: The "amount" alias has been removed. Use "questionsPerRequest" only. ' +
			'For TIME_LIMITED mode: time in seconds (30-300). ' +
			'For other modes: number of questions (1-10) or -1 for unlimited. ' +
			'See VALIDATION_CONFIG.QUESTIONS.UNLIMITED for explanation of why -1 is used instead of Infinity or a string.',
		minimum: VALIDATION_COUNT.QUESTIONS.MIN,
		maximum: Math.max(VALIDATION_COUNT.QUESTIONS.UNLIMITED, VALIDATION_COUNT.TIME_LIMIT.MAX),
	})
	@IsNotEmpty({ message: 'Questions per request is required' })
	@Transform(({ value }) => {
		if (value == null) {
			return undefined;
		}
		// If already a number, return as-is (validate it's integer)
		if (typeof value === 'number' && Number.isFinite(value)) {
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
	@Min(VALIDATION_COUNT.QUESTIONS.MIN, {
		message: `Questions per request must be at least ${VALIDATION_COUNT.QUESTIONS.MIN}`,
	})
	// Allow larger values for TIME_LIMITED mode (validated in service)
	// For other modes, validate max is QUESTIONS.MAX or UNLIMITED
	@ValidateIf((o: DeductCreditsDto) => {
		const isUnlimited = o.questionsPerRequest === VALIDATION_COUNT.QUESTIONS.UNLIMITED;
		const isWithinQuestionLimit = o.questionsPerRequest <= VALIDATION_COUNT.QUESTIONS.MAX;
		const isWithinTimeLimit = o.questionsPerRequest <= VALIDATION_COUNT.TIME_LIMIT.MAX;
		// Allow if unlimited, within question limit, or within time limit (service will validate based on gameMode)
		return isUnlimited || isWithinQuestionLimit || isWithinTimeLimit;
	})
	@Max(Math.max(VALIDATION_COUNT.QUESTIONS.MAX, VALIDATION_COUNT.TIME_LIMIT.MAX), {
		message: `Questions per request cannot exceed ${Math.max(VALIDATION_COUNT.QUESTIONS.MAX, VALIDATION_COUNT.TIME_LIMIT.MAX)}`,
	})
	questionsPerRequest: number;

	@ApiProperty({
		description:
			'Game mode for the deduction. ' + 'BREAKING CHANGE: The "gameType" alias has been removed. Use "gameMode" only.',
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
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.REASON.MAX, {
		message: `Reason cannot exceed ${VALIDATION_LENGTH.REASON.MAX} characters`,
	})
	reason?: string;
}

export class PurchaseCreditsDto extends PaymentMethodDetailsDto {
	@ApiProperty({
		description: 'Package ID for credits purchase',
		minLength: 1,
		maxLength: 50,
	})
	@IsString()
	@IsNotEmpty({ message: 'Package ID is required' })
	@MinLength(1, { message: 'Package ID must be at least 1 character long' })
	@MaxLength(50, { message: 'Package ID cannot exceed 50 characters' })
	packageId: string;
}

export class GetCreditHistoryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of transactions to return',
		minimum: VALIDATION_COUNT.LEADERBOARD.MIN,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
		default: VALIDATION_COUNT.LEADERBOARD.DEFAULT,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(VALIDATION_COUNT.LEADERBOARD.MIN, {
		message: `Limit must be at least ${VALIDATION_COUNT.LEADERBOARD.MIN}`,
	})
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}`,
	})
	limit: number = VALIDATION_COUNT.LEADERBOARD.DEFAULT;
}

export class CanPlayDto {
	@ApiPropertyOptional({
		description: 'Number of questions per request to check if user can play',
		minimum: VALIDATION_COUNT.QUESTIONS.MIN,
		maximum: VALIDATION_COUNT.QUESTIONS.UNLIMITED,
	})
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
	@IsNumber({}, { message: 'Questions per request must be a number' })
	@Min(VALIDATION_COUNT.QUESTIONS.MIN, {
		message: `Questions per request must be at least ${VALIDATION_COUNT.QUESTIONS.MIN}`,
	})
	@ValidateIf((o: CanPlayDto) => o.questionsPerRequest !== VALIDATION_COUNT.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_COUNT.QUESTIONS.MAX, {
		message: `Questions per request cannot exceed ${VALIDATION_COUNT.QUESTIONS.MAX} (use ${VALIDATION_COUNT.QUESTIONS.UNLIMITED} for unlimited mode)`,
	})
	questionsPerRequest?: number;

	@ApiPropertyOptional({
		description: 'Game mode to evaluate (optional)',
		enum: VALID_GAME_MODES,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_GAME_MODES, {
		message: `Game mode must be one of: ${VALID_GAME_MODES.join(', ')}`,
	})
	gameMode?: GameMode;
}
