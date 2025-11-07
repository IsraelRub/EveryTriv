/**
 * Achievement Types
 * @module AchievementTypes
 * @description Achievement-related types and interfaces
 * @used_by client/src/components/stats, server/src/internal/entities
 */

/**
 * User game achievements
 * @used_by client/src/components/stats, server/src/internal/entities/user.entity.ts, server/src/internal/entities/userStats.entity.ts
 */
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
	category: string;
	points: number;
}
