import { Module } from '@nestjs/common';

import { LanguageToolService } from './languageTool.service';
import { ValidationService } from './validation.service';

@Module({
	providers: [ValidationService, LanguageToolService],
	exports: [ValidationService, LanguageToolService],
})
export class ValidationModule {}
