import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

import { DifficultyLevel, VALIDATION_CONFIG } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

export class TriviaRequestDto {
	@ApiProperty({ description: 'Trivia topic' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)' })
	@IsString()
	difficulty!: GameDifficulty;

	@ApiPropertyOptional({
		description: 'Normalized difficulty level (DifficultyLevel enum) - set automatically by pipe',
		enum: DifficultyLevel,
	})
	@IsOptional()
	@IsEnum(DifficultyLevel)
	mappedDifficulty?: DifficultyLevel;

	@ApiProperty({
		description:
			'Number of questions per request (-1 for unlimited mode). See VALIDATION_CONFIG.limits.QUESTIONS.UNLIMITED for explanation of why -1 is used instead of Infinity or a string.',
		minimum: VALIDATION_CONFIG.limits.QUESTIONS.MIN,
		maximum: VALIDATION_CONFIG.limits.QUESTIONS.UNLIMITED,
		example: 10,
	})
	@IsInt()
	@Min(VALIDATION_CONFIG.limits.QUESTIONS.MIN)
	@ValidateIf((o: TriviaRequestDto) => o.questionsPerRequest !== VALIDATION_CONFIG.limits.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_CONFIG.limits.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiPropertyOptional({ description: 'Optional category for the trivia questions' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	category?: string;

	@ApiPropertyOptional({ description: 'Optional user identifier (for personalization)' })
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiPropertyOptional({ description: 'Optional game mode associated with this trivia request' })
	@IsOptional()
	@IsString()
	gameMode?: string;

	@ApiPropertyOptional({ description: 'Optional time limit per question in seconds. Undefined means no time limit.' })
	@IsOptional()
	@IsInt()
	@Max(3600)
	timeLimit?: number;

	@ApiPropertyOptional({
		description:
			'Optional maximum number of questions for the session. Undefined means no question limit (unlimited mode).',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	maxQuestionsPerGame?: number;

	@ApiPropertyOptional({
		description: 'Number of answer choices per question (3-5)',
		minimum: VALIDATION_CONFIG.limits.ANSWER_COUNT.MIN,
		maximum: VALIDATION_CONFIG.limits.ANSWER_COUNT.MAX,
		example: 4,
		default: 4,
	})
	@IsOptional()
	@IsInt()
	@Min(VALIDATION_CONFIG.limits.ANSWER_COUNT.MIN)
	@Max(VALIDATION_CONFIG.limits.ANSWER_COUNT.MAX)
	answerCount?: number;
}
