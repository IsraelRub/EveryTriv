import {
	Award,
	BookOpen,
	Crown,
	Flame,
	GamepadIcon,
	GraduationCap,
	Medal,
	Star,
	Target,
	Trophy,
	Zap,
	type LucideIcon,
} from 'lucide-react';

import { AchievementIconName } from '@shared/constants';
import type { Achievement } from '@shared/types';

export const achievementIconMap: Record<AchievementIconName | string, LucideIcon> = {
	[AchievementIconName.GAMEPAD_ICON]: GamepadIcon,
	[AchievementIconName.TROPHY]: Trophy,
	[AchievementIconName.AWARD]: Award,
	[AchievementIconName.MEDAL]: Medal,
	[AchievementIconName.CROWN]: Crown,
	[AchievementIconName.FLAME]: Flame,
	[AchievementIconName.ZAP]: Zap,
	[AchievementIconName.STAR]: Star,
	[AchievementIconName.GRADUATION_CAP]: GraduationCap,
	[AchievementIconName.TARGET]: Target,
	[AchievementIconName.BOOK_OPEN]: BookOpen,
} as Record<AchievementIconName | string, LucideIcon>;

export function getAchievementIcon(achievement: Achievement): LucideIcon {
	// Icon is always a string (AchievementIconName enum or string value)
	if (typeof achievement.icon === 'string') {
		const iconFromMap = achievementIconMap[achievement.icon];
		if (iconFromMap) {
			return iconFromMap;
		}
	}

	// Default fallback if icon not found in map
	return Award;
}

export function calculateTotalAchievementPoints(achievements: Achievement[] | null | undefined): number {
	if (!achievements || achievements.length === 0) {
		return 0;
	}
	return achievements.reduce((sum, achievement) => sum + achievement.points, 0);
}
