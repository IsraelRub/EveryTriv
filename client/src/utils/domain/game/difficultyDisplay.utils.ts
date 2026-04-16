import type { TFunction } from 'i18next';

import { DifficultyLevel } from '@shared/constants';
import { formatDifficulty } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { DIFFICULTY_LABEL_KEYS } from '@/constants';

export function getDifficultyDisplayLabel(difficulty: string | null | undefined, t: TFunction): string {
	if (VALIDATORS.string(difficulty) && difficulty in DIFFICULTY_LABEL_KEYS) {
		return t(DIFFICULTY_LABEL_KEYS[difficulty as DifficultyLevel]);
	}
	return formatDifficulty(difficulty);
}
