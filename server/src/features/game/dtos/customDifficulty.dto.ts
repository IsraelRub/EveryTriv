import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Locale, VALIDATION_LENGTH } from '@shared/constants';

export class ValidateCustomDifficultyDto {
	@ApiProperty({ description: 'Custom difficulty free text' })
	@IsString()
	@MinLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MIN)
	@MaxLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX)
	customText!: string;

	@ApiPropertyOptional({
		description: 'Expected language for validation (en/he). When set, text is validated in this language.',
		enum: [Locale.EN, Locale.HE],
	})
	@IsOptional()
	@IsIn([Locale.EN, Locale.HE])
	language?: Locale;
}
