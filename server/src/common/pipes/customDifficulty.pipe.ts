import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ErrorCode } from '@shared/constants';
import type { CustomDifficultyRequest } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';
import { validateCustomDifficultyText } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';

import { GameTextLanguageGateService } from '../validation';

@Injectable()
export class CustomDifficultyPipe implements PipeTransform {
	constructor(private readonly gameTextLanguageGate: GameTextLanguageGateService) {}

	async transform(value: CustomDifficultyRequest): Promise<CustomDifficultyRequest> {
		const startTime = Date.now();

		try {
			// First, perform basic validation
			const basicValidation = validateCustomDifficultyText(value.customText);

			if (!basicValidation.isValid) {
				logger.apiUpdate('customDifficulty_validation', {
					isValid: false,
					errorsCount: basicValidation.errors.length,
					duration: calculateDuration(startTime),
					validationType: 'basic',
				});

				throw new BadRequestException(
					basicValidation.errors.join(', ') || ErrorCode.CUSTOM_DIFFICULTY_VALIDATION_FAILED
				);
			}

			await this.gameTextLanguageGate.assertNaturalTextValid(value.customText, value.language);

			logger.apiUpdate('customDifficulty_validation', {
				isValid: true,
				errorsCount: basicValidation.errors.length,
				duration: calculateDuration(startTime),
				validationType: 'language',
			});

			return value;
		} catch (error) {
			logger.apiUpdateError('customDifficulty_validation', getErrorMessage(error));

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException(ErrorCode.CUSTOM_DIFFICULTY_VALIDATION_FAILED);
		}
	}
}
