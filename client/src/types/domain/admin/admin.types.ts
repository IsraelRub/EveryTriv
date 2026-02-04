import type { LucideIcon } from 'lucide-react';

import type { TriviaQuestion } from '@shared/types';

import type { TextColor } from '@/constants';

export interface ClearOperation {
	id: string;
	title: string;
	description: string;
	itemName: string;
	currentCount?: number;
	onClear: () => void;
	isLoading?: boolean;
	icon: LucideIcon;
}

export interface AdminTriviaQuestion extends TriviaQuestion {
	userId: string | null;
	isCorrect: boolean | null;
}

export interface TriviaQuestionsResponse {
	questions: AdminTriviaQuestion[];
	totalCount: number;
}

export interface PlatformTrendsSectionStats {
	icon: LucideIcon;
	label: string;
	value: string;
	color: TextColor;
}
