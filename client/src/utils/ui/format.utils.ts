/**
 * UI Format Utilities
 *
 * @module UIFormatUtils
 * @description Client-specific UI formatting utilities
 */

// Re-export client-specific formatting functions
export { formatDisplayName, formatNumber, formatRelativeTime, formatScore, formatTopic } from '../format.utils';

/**
 * Get icon name for difficulty level
 */
export const getDifficultyIcon = (difficulty: string): string => {
	if (difficulty.startsWith('custom_')) {
		return 'question';
	}

	switch (difficulty.toLowerCase()) {
		case 'easy':
			return 'easy';
		case 'medium':
			return 'medium';
		case 'hard':
			return 'hard';
		default:
			return 'question';
	}
};
