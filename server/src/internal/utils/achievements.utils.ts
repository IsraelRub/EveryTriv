import type { AchievementCalculationContext, SavedAchievement } from '@shared/types';

import { ACHIEVEMENT_DEFINITIONS } from '@internal/constants';
import type { AchievementDefinition } from '@internal/types';

function getAchievementDefinition(id: string): AchievementDefinition | undefined {
	return ACHIEVEMENT_DEFINITIONS[id];
}

export function buildAchievementFromSaved(saved: SavedAchievement): SavedAchievement | null {
	const definition = getAchievementDefinition(saved.id);
	if (!definition) {
		return null;
	}
	return {
		id: saved.id,
		unlockedAt: saved.unlockedAt,
		points: saved.points,
		progress: saved.progress,
		maxProgress: saved.maxProgress,
	};
}

export function buildAchievementFromDefinition(
	definition: AchievementDefinition,
	context: AchievementCalculationContext,
	unlockedAt?: string
): SavedAchievement {
	const points = definition.calculatePoints(context);
	return {
		id: definition.id,
		unlockedAt,
		points,
	};
}

export function buildAllAchievements(context: AchievementCalculationContext): SavedAchievement[] {
	const achievements: SavedAchievement[] = [];

	for (const definition of Object.values(ACHIEVEMENT_DEFINITIONS)) {
		if (definition.shouldUnlock(context)) {
			achievements.push(buildAchievementFromDefinition(definition, context));
		}
	}

	return achievements;
}
