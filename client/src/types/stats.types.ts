/**
 * Stats Types for EveryTriv Client
 *
 * @module ClientStatsTypes
 * @description Client-specific stats and analytics type definitions
 */

export interface UserStatsResponse {
	totalGames: number;
	totalScore: number;
	averageScore: number;
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
	achievements: Array<{
		id: string;
		name: string;
		description: string;
		icon: string;
		unlockedAt?: string;
		progress?: number;
		maxProgress?: number;
		category: string;
		points: number;
	}>;
}
