/**
 * Achievement Types
 * @module AchievementTypes
 * @description Achievement-related types and interfaces
 */

// Achievement Types
/**
 * הישגי משתמש במשחק
 * @used_by client/src/components/stats/Achievements.tsx
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
