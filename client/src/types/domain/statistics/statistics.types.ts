import type { LucideIcon } from 'lucide-react';

import type { AchievementCalculationContext } from '@shared/types';

import { AchievementCardVariant, AchievementsDescriptionKind } from '@/constants';

export interface Achievement {
	id: string;
	name: string;
	description: string;
	category: string;
	points: number;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
}

export interface AchievementCardProps {
	achievement?: Achievement;
	variant?: AchievementCardVariant;
	className?: string;
	showUnlockedDate?: boolean;
	isLoading?: boolean;
}

export interface AchievementsSectionProps {
	achievements: Achievement[];
	variant?: AchievementCardVariant;
	showUnlockedDate?: boolean;
	descriptionKind: AchievementsDescriptionKind;
	headerActions?: React.ReactNode;
	emptyMessage?: string;
	emptyIcon?: LucideIcon;
	cardClassName?: string;
	titleIcon?: LucideIcon;
}

export interface AchievementDisplayDefinition {
	name: string;
	description: string;
	buildName?: (ctx: AchievementCalculationContext) => string;
	buildDescription?: (ctx: AchievementCalculationContext) => string;
}
