import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { Locale, SurpriseScope } from '@shared/constants';

export class SurprisePickQueryDto {
	@ApiPropertyOptional({
		description: 'Which dimension to randomize for surprise mode',
		enum: SurpriseScope,
	})
	@IsOptional()
	@IsEnum(SurpriseScope, { message: 'scope must be topic, difficulty, or both' })
	scope?: SurpriseScope;

	@ApiPropertyOptional({
		description: 'Locale hint for localized surprise content',
		enum: Locale,
	})
	@IsOptional()
	@IsEnum(Locale, { message: 'locale must be a supported locale (en or he)' })
	locale?: Locale;
}
