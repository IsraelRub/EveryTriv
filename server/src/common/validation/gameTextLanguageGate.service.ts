import { BadRequestException, Injectable } from '@nestjs/common';

import { DEFAULT_LANGUAGE, Locale } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { extractCustomDifficultyText, isCustomDifficulty, validateTriviaRequest } from '@shared/validation';

import { LanguageToolService } from './languageTool.service';

@Injectable()
export class GameTextLanguageGateService {
	constructor(private readonly languageToolService: LanguageToolService) {}

	async assertNaturalTextValid(text: string, outputLanguage?: Locale): Promise<void> {
		const result =
			outputLanguage != null
				? await this.languageToolService.checkGameNaturalText(text, { outputLanguage })
				: await this.languageToolService.checkGameNaturalText(text, { detectLanguage: true });

		if (!result.isValid) {
			throw new BadRequestException({
				message: 'Language validation failed',
				errors: result.errors,
			});
		}
	}

	/**
	 * Shared trivia rules (length, forbidden words, difficulty shape) plus LanguageTool on topic and custom-difficulty text.
	 */
	async assertTriviaGameInputValid(topic: string, difficulty: GameDifficulty, outputLanguage: Locale): Promise<void> {
		const triviaValidation = validateTriviaRequest(topic, difficulty);
		if (!triviaValidation.isValid) {
			throw new BadRequestException({
				message: 'Trivia request validation failed',
				errors: triviaValidation.errors,
			});
		}

		await this.assertTopicAndCustomDifficultyLanguageValid(topic, difficulty, outputLanguage);
	}

	/**
	 * LanguageTool only — caller must run structural validation first when needed.
	 */
	async assertTopicAndCustomDifficultyLanguageValid(
		topic: string,
		difficulty: GameDifficulty,
		outputLanguage: Locale = DEFAULT_LANGUAGE
	): Promise<void> {
		await this.assertNaturalTextValid(topic, outputLanguage);

		if (isCustomDifficulty(difficulty)) {
			const customText = extractCustomDifficultyText(difficulty).trim();
			if (customText.length > 0) {
				await this.assertNaturalTextValid(customText, outputLanguage);
			}
		}
	}
}
