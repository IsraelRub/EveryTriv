/**
 * Admin Component Types
 * @module AdminComponentTypes
 * @description Type definitions for admin-related components
 */

import type { LucideIcon } from 'lucide-react';

import type { AdminGameStatistics, TriviaQuestion } from '@shared/types';

/**
 * Clear operation interface
 * @interface ClearOperation
 * @description Configuration for a clear operation in management actions
 * @used_by client/src/components/admin/ManagementActions.tsx
 */
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

/**
 * Management actions component props
 * @interface ManagementActionsProps
 * @description Props for the ManagementActions component
 * @used_by client/src/components/admin/ManagementActions.tsx
 */
export interface ManagementActionsProps {
	operations: ClearOperation[];
}

/**
 * Admin-specific trivia question with additional fields from database entity
 * @interface AdminTriviaQuestion
 * @description Extended trivia question with admin-specific fields (userId, isCorrect)
 * @used_by client/src/components/admin/TriviaManagementTable.tsx
 */
export interface AdminTriviaQuestion extends TriviaQuestion {
	userId: string | null;
	isCorrect: boolean | null;
}

/**
 * Response interface for getting all trivia questions (Admin only)
 * @interface AllTriviaQuestionsResponse
 * @description Response structure for admin trivia questions endpoint
 * @used_by client/src/services/domain/game.service.ts, client/src/hooks/useAdminGame.ts
 */
export interface AllTriviaQuestionsResponse {
	questions: AdminTriviaQuestion[];
	totalCount: number;
}

/**
 * Trivia management table component props
 * @interface TriviaManagementTableProps
 * @description Props for the TriviaManagementTable component
 * @used_by client/src/components/admin/TriviaManagementTable.tsx
 */
export interface TriviaManagementTableProps {
	questions?: AdminTriviaQuestion[];
	totalCount?: number;
	isLoading?: boolean;
	onClearAll?: () => void;
}

/**
 * Game statistics interface
 * @interface GameStatistics
 * @description Game statistics data structure (alias for AdminGameStatistics from shared types)
 * @used_by client/src/components/admin/GameStatisticsCard.tsx
 */
export type GameStatistics = AdminGameStatistics;

/**
 * Game statistics card component props
 * @interface GameStatisticsCardProps
 * @description Props for the GameStatisticsCard component
 * @used_by client/src/components/admin/GameStatisticsCard.tsx
 */
export interface GameStatisticsCardProps {
	data?: GameStatistics;
	isLoading?: boolean;
	onRefresh?: () => void;
}

/**
 * Confirm clear dialog component props
 * @interface ConfirmClearDialogProps
 * @description Props for the ConfirmClearDialog component
 * @used_by client/src/components/admin/ConfirmClearDialog.tsx
 */
export interface ConfirmClearDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	itemName: string;
	onConfirm: () => void;
	isLoading?: boolean;
}
