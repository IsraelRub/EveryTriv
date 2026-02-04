import type { LucideIcon } from 'lucide-react';

import type { Achievement } from '@shared/types';

import { AchievementCardVariant } from '@/constants';

export interface Insight {
	text: string;
	icon: LucideIcon;
}

export interface AchievementCardProps {
	achievement?: Achievement;
	variant?: AchievementCardVariant;
	className?: string;
	showUnlockedDate?: boolean;
	isLoading?: boolean;
}
