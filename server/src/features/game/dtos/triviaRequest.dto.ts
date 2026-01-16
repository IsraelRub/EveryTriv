import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

import { DifficultyLevel, TIME_DURATIONS_SECONDS, VALIDATION_COUNT } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

import { IsGameDifficulty } from '@common/decorators';

export class TriviaRequestDto {
	@ApiProperty({ description: 'Trivia topic' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)' })
	@IsString()
	@IsGameDifficulty()
	difficulty!: GameDifficulty;

	@ApiPropertyOptional({
		description: 'Normalized difficulty level (DifficultyLevel enum) - set automatically by pipe',
		enum: DifficultyLevel,
	})
	mappedDifficulty?: DifficultyLevel;

	@ApiProperty({
		description:
			'Number of questions per request (-1 for unlimited mode). See VALIDATION_CONFIG.QUESTIONS.UNLIMITED for explanation of why -1 is used instead of Infinity or a string.',
		minimum: VALIDATION_COUNT.QUESTIONS.MIN,
		maximum: VALIDATION_COUNT.QUESTIONS.UNLIMITED,
	})
	@IsInt()
	@Min(VALIDATION_COUNT.QUESTIONS.MIN)
	@ValidateIf((o: TriviaRequestDto) => o.questionsPerRequest !== VALIDATION_COUNT.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_COUNT.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiPropertyOptional({
		description: 'Optional category for the trivia questions',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	category?: string;

	@ApiPropertyOptional({
		description: 'Optional user identifier (for personalization)',
	})
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiPropertyOptional({
		description: 'Optional game mode associated with this trivia request',
	})
	@IsOptional()
	@IsString()
	gameMode?: string;

	@ApiPropertyOptional({
		description: 'Optional time limit per question in seconds. Undefined means no time limit.',
		maximum: TIME_DURATIONS_SECONDS.HOUR,
		minimum: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(TIME_DURATIONS_SECONDS.HOUR)
	timeLimit?: number;

	@ApiPropertyOptional({
		description:
			'Optional maximum number of questions for the session. Undefined means no question limit (unlimited mode).',
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	maxQuestionsPerGame?: number;

	@ApiPropertyOptional({
		description: 'Number of answer choices per question (3-5)',
		minimum: VALIDATION_COUNT.ANSWER_COUNT.MIN,
		maximum: VALIDATION_COUNT.ANSWER_COUNT.MAX,
		default: VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
	})
	@IsOptional()
	@IsInt()
	@Min(VALIDATION_COUNT.ANSWER_COUNT.MIN)
	@Max(VALIDATION_COUNT.ANSWER_COUNT.MAX)
	answerCount?: number;
}
