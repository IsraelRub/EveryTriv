import { Module } from '@nestjs/common';

import { LanguageToolService } from './languageTool.service';
import { ValidationService } from './validation.service';

@Module({
	providers: [LanguageToolService, ValidationService],
	exports: [LanguageToolService, ValidationService],
})
export class ValidationModule {}
