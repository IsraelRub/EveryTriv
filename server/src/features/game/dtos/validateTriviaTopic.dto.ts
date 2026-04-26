import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { Locale, VALIDATION_LENGTH } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

import { IsGameDifficulty } from '@common/decorators';

export class ValidateTriviaTopicDto {
	@ApiProperty({ description: 'Trivia topic to validate before starting a game' })
	@IsString()
	@MinLength(VALIDATION_LENGTH.TOPIC.MIN)
	@MaxLength(VALIDATION_LENGTH.TOPIC.MAX)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)' })
	@IsString()
	@IsGameDifficulty()
	difficulty!: GameDifficulty;

	@ApiProperty({
		description: 'Language for generated trivia (en = English, he = Hebrew).',
		enum: Locale,
	})
	@IsString()
	@IsEnum(Locale)
	outputLanguage!: Locale;
}
