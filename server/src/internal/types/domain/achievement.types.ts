import type { AchievementCalculationContext } from '@shared/types';

/** Server-side achievement definition; only id + unlock/points logic. */
export interface AchievementDefinition {
	id: string;
	calculatePoints: (stats: AchievementCalculationContext) => number;
	shouldUnlock: (stats: AchievementCalculationContext) => boolean;
}
