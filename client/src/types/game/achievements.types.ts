/**
 * Achievement Types
 * @module AchievementTypes
 * @description Achievement-related types and interfaces
 */

/**
 * User game achievements
 * @used_by client/src/components/stats
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
