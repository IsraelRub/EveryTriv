import { DifficultyLevel } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { isCustomDifficulty } from '@shared/validation';

export function restoreGameDifficulty(difficulty: DifficultyLevel, metadata?: string): GameDifficulty {
	if (difficulty === DifficultyLevel.CUSTOM && metadata) {
		if (isCustomDifficulty(metadata)) {
			return metadata;
		}
	}
	return difficulty;
}
