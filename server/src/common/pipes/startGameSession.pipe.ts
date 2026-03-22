import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { DEFAULT_LANGUAGE, Locale } from '@shared/constants';
import { isLocale } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import { StartGameSessionDto } from '@features/game/dtos';

import { GameTextLanguageGateService } from '../validation';

@Injectable()
export class StartGameSessionPipe implements PipeTransform {
	constructor(private readonly gameTextLanguageGate: GameTextLanguageGateService) {}

	async transform(value: unknown): Promise<StartGameSessionDto> {
		if (!this.isRecord(value)) {
			throw new BadRequestException({
				message: 'Invalid session start payload',
				errors: ['Request body must be an object'],
			});
		}

		if (!this.hasRequiredFields(value)) {
			logger.validationWarn('start_game_session', '[REDACTED]', 'incomplete_payload');
			throw new BadRequestException({
				message: 'Invalid session start payload',
				errors: ['gameId, topic, difficulty, and gameMode are required'],
			});
		}

		const body: StartGameSessionDto = value;
		const outputLanguage: Locale =
			body.outputLanguage != null && isLocale(body.outputLanguage) ? body.outputLanguage : DEFAULT_LANGUAGE;

		await this.gameTextLanguageGate.assertTriviaGameInputValid(body.topic, body.difficulty, outputLanguage);

		return body;
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return value !== null && typeof value === 'object' && !Array.isArray(value);
	}

	private hasRequiredFields(value: unknown): value is StartGameSessionDto {
		if (!this.isRecord(value)) {
			return false;
		}

		return (
			typeof value.gameId === 'string' &&
			typeof value.topic === 'string' &&
			typeof value.difficulty === 'string' &&
			typeof value.gameMode === 'string'
		);
	}
}
