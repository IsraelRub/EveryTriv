import { Module } from '@nestjs/common';

import { LanguageToolService } from './languageTool.service';

@Module({
	providers: [LanguageToolService],
	exports: [LanguageToolService],
})
export class ValidationModule {}
