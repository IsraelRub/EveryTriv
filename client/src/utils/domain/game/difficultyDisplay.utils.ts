import type { TFunction } from 'i18next';

import { DifficultyLevel } from '@shared/constants';
import { formatDifficulty } from '@shared/utils';

import { DIFFICULTY_LABEL_KEYS } from '@/constants';

export function getDifficultyDisplayLabel(difficulty: string | null | undefined, t: TFunction): string {
	if (typeof difficulty === 'string' && difficulty in DIFFICULTY_LABEL_KEYS) {
		return t(DIFFICULTY_LABEL_KEYS[difficulty as DifficultyLevel]);
	}
	return formatDifficulty(difficulty);
}
