import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Locale, VALIDATION_LENGTH, ValidateTextContext } from '@shared/constants';

export class ValidateTextDto {
	@ApiProperty({ description: 'Text to validate (topic or custom difficulty description)' })
	@IsString()
	@MinLength(1, { message: 'Text is required' })
	@MaxLength(Math.max(VALIDATION_LENGTH.TOPIC.MAX, VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX))
	text!: string;

	@ApiPropertyOptional({
		description: 'Context for optional length rules',
		enum: ValidateTextContext,
	})
	@IsOptional()
	@IsIn(Object.values(ValidateTextContext))
	context?: ValidateTextContext;

	@ApiPropertyOptional({
		description:
			'Expected language for validation (en/he). When set, text is validated in this language; otherwise language is auto-detected and English is enforced.',
		enum: [Locale.EN, Locale.HE],
	})
	@IsOptional()
	@IsIn([Locale.EN, Locale.HE])
	language?: Locale;
}
