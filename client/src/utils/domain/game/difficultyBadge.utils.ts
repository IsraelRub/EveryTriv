import { DifficultyLevel } from '@shared/constants';

import { DIFFICULTY_UI_CONFIG } from '@/constants';

export function getDifficultyBadgeClasses(difficulty: unknown): string {
	const key = String(difficulty ?? '').toLowerCase();
	if (key === DifficultyLevel.CUSTOM || key.startsWith('custom:')) {
		return DIFFICULTY_UI_CONFIG[DifficultyLevel.CUSTOM].badgeClasses;
	}
	const standardLevel = Object.values(DifficultyLevel).find(level => level === key);
	const badgeClasses = standardLevel != null ? DIFFICULTY_UI_CONFIG[standardLevel].badgeClasses : undefined;
	return badgeClasses ?? 'bg-muted/20 border-muted text-muted-foreground';
}
