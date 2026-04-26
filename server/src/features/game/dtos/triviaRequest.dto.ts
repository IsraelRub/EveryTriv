import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

import { Locale, VALIDATION_COUNT, VALIDATION_LENGTH } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

import { IsGameDifficulty } from '@common/decorators';

export class TriviaRequestDto {
	@ApiProperty({ description: 'Trivia topic' })
	@IsString()
	@MinLength(VALIDATION_LENGTH.TOPIC.MIN)
	@MaxLength(VALIDATION_LENGTH.TOPIC.MAX)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)' })
	@IsString()
	@IsGameDifficulty()
	difficulty!: GameDifficulty;

	@ApiProperty({
		description:
			'Number of questions per request (-1 for unlimited mode). See VALIDATION_CONFIG.QUESTIONS.UNLIMITED for explanation of why -1 is used instead of Infinity or a string.',
		minimum: VALIDATION_COUNT.QUESTIONS.MIN,
		maximum: VALIDATION_COUNT.QUESTIONS.UNLIMITED,
	})
	@IsInt()
	@ValidateIf((o: TriviaRequestDto) => o.questionsPerRequest !== VALIDATION_COUNT.QUESTIONS.UNLIMITED)
	@Min(VALIDATION_COUNT.QUESTIONS.MIN)
	@ValidateIf((o: TriviaRequestDto) => o.questionsPerRequest !== VALIDATION_COUNT.QUESTIONS.UNLIMITED)
	@Max(VALIDATION_COUNT.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiPropertyOptional({
		description:
			'Optional game session ID. When provided with authenticated user, server stores question snapshots in session for consistent answer evaluation.',
	})
	@IsOptional()
	@IsString()
	gameId?: string;

	@ApiProperty({
		description: 'Number of answer choices per question (3-5)',
		minimum: VALIDATION_COUNT.ANSWER_COUNT.MIN,
		maximum: VALIDATION_COUNT.ANSWER_COUNT.MAX,
	})
	@IsInt()
	@Min(VALIDATION_COUNT.ANSWER_COUNT.MIN)
	@Max(VALIDATION_COUNT.ANSWER_COUNT.MAX)
	answerCount!: number;

	@ApiProperty({
		description: 'Language for the generated question and answers (en = English, he = Hebrew).',
		enum: Locale,
	})
	@IsString()
	@IsEnum(Locale)
	outputLanguage!: Locale;
}
