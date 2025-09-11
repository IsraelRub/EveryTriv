import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	VALID_DIFFICULTIES,
	VALID_QUESTION_COUNTS,
	VALIDATION_LIMITS,
} from '@shared';
import { isCustomDifficulty } from '@shared';

export class TriviaRequestDto {
	@IsString()
	@MinLength(VALIDATION_LIMITS.TOPIC.MIN_LENGTH)
	@MaxLength(VALIDATION_LIMITS.TOPIC.MAX_LENGTH)
	topic: string = '';

	@IsString()
	@ValidateIf(o => !isCustomDifficulty(o.difficulty))
	@IsIn(VALID_DIFFICULTIES.filter((d: string) => d !== DifficultyLevel.CUSTOM))
	difficulty: string = DifficultyLevel.MEDIUM;

	@IsString()
	@ValidateIf(o => isCustomDifficulty(o.difficulty))
	@Matches(new RegExp(`^${CUSTOM_DIFFICULTY_PREFIX}.+`))
	@MinLength(VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MIN_LENGTH + CUSTOM_DIFFICULTY_PREFIX.length)
	@MaxLength(VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MAX_LENGTH + CUSTOM_DIFFICULTY_PREFIX.length)
	customDifficulty?: string;

	@IsNumber()
	@IsIn(VALID_QUESTION_COUNTS)
	questionCount: number = 3;

	@IsString()
	@IsOptional()
	userId?: string;
}
