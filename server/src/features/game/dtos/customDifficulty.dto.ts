import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { VALIDATION_LENGTH } from '@shared/constants';

export class ValidateCustomDifficultyDto {
	@ApiProperty({ description: 'Custom difficulty free text' })
	@IsString()
	@MinLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MIN)
	@MaxLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX)
	customText!: string;
}
