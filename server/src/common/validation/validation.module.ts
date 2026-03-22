import { Module } from '@nestjs/common';

import { GameTextLanguageGateService } from './gameTextLanguageGate.service';
import { LanguageToolService } from './languageTool.service';

@Module({
	providers: [LanguageToolService, GameTextLanguageGateService],
	exports: [LanguageToolService, GameTextLanguageGateService],
})
export class ValidationModule {}
