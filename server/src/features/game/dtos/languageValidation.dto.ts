import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateLanguageDto {
	@ApiProperty({ description: 'Text to validate with language tools' })
	@IsString()
	@MinLength(1)
	@MaxLength(2000)
	text!: string;

	@ApiPropertyOptional({ description: 'Enable spell check' })
	@IsOptional()
	@IsBoolean()
	enableSpellCheck?: boolean;

	@ApiPropertyOptional({ description: 'Enable grammar check' })
	@IsOptional()
	@IsBoolean()
	enableGrammarCheck?: boolean;
}
