import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
	ValidateNested,
} from 'class-validator';

import { GameMode, VALIDATION_COUNT, VALIDATION_LENGTH } from '@shared/constants';

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
		description: `Game mode for the deduction. BREAKING CHANGE: The "gameType" alias has been removed. Use "gameMode" only.`,
		enum: GameMode,
	})
	@IsOptional()
	@IsEnum(GameMode, {
		message: 'Game mode must be a valid GameMode value',
	})
	gameMode?: GameMode;

	@ApiPropertyOptional({
		description: 'Reason for deduction (for logging purposes)',
		maxLength: VALIDATION_LENGTH.REASON.MAX,
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
		minLength: VALIDATION_LENGTH.NAME.MIN,
		maxLength: VALIDATION_LENGTH.NAME.MAX,
	})
	@IsString()
	@IsNotEmpty({ message: 'Package ID is required' })
	@MinLength(VALIDATION_LENGTH.NAME.MIN, {
		message: `Package ID must be at least ${VALIDATION_LENGTH.NAME.MIN} character long`,
	})
	@MaxLength(VALIDATION_LENGTH.NAME.MAX, {
		message: `Package ID cannot exceed ${VALIDATION_LENGTH.NAME.MAX} characters`,
	})
	packageId: string;
}

export class CreditPackageItemDto {
	@ApiProperty({ description: 'Package ID', example: 'package_50' })
	@IsString()
	@IsNotEmpty()
	id: string;

	@ApiProperty({ description: 'Number of credits', minimum: 1 })
	@IsNumber()
	@Min(1)
	credits: number;

	@ApiProperty({ description: 'Price in USD', minimum: 0.01 })
	@IsNumber()
	@Min(0.01)
	price: number;

	@ApiPropertyOptional({ description: 'Tier label', example: 'basic' })
	@IsOptional()
	@IsString()
	tier?: string;
}

export class UpdateCreditPackagesDto {
	@ApiProperty({ type: [CreditPackageItemDto], description: 'Credit packages to set' })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreditPackageItemDto)
	packages: CreditPackageItemDto[];
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
		enum: GameMode,
	})
	@IsOptional()
	@IsEnum(GameMode, { message: 'Game mode must be a valid GameMode value' })
	gameMode?: GameMode;
}
