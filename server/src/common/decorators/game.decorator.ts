/**
 * Game Decorators
 *
 * @module GameDecorators
 * @description Decorators for game-specific functionality
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Set game difficulty requirement
 * @param difficulties Array of required difficulties
 * @returns Method decorator that sets game difficulty requirement
 */
export const GameDifficulty = (...difficulties: string[]) => SetMetadata('gameDifficulty', difficulties);

/**
 * Set game mode requirement
 * @param modes Array of required game modes
 * @returns Method decorator that sets game mode requirement
 */
export const GameMode = (...modes: string[]) => SetMetadata('gameMode', modes);

/**
 * Set points requirement for game action
 * @param minPoints Minimum points required
 * @returns Method decorator that sets points requirement
 */
export const RequireGamePoints = (minPoints: number) => SetMetadata('requireGamePoints', minPoints);

/**
 * Set game session requirement
 * @param requireActive Whether to require active game session
 * @returns Method decorator that sets game session requirement
 */
export const RequireGameSession = (requireActive: boolean = true) => SetMetadata('requireGameSession', requireActive);

/**
 * Set game topic requirement
 * @param topics Array of required topics
 * @returns Method decorator that sets game topic requirement
 */
export const GameTopic = (...topics: string[]) => SetMetadata('gameTopic', topics);

/**
 * Set game level requirement
 * @param minLevel Minimum game level required
 * @returns Method decorator that sets game level requirement
 */
export const RequireGameLevel = (minLevel: number) => SetMetadata('requireGameLevel', minLevel);

/**
 * Set game achievement requirement
 * @param achievements Array of required achievements
 * @returns Method decorator that sets game achievement requirement
 */
export const RequireGameAchievement = (...achievements: string[]) =>
	SetMetadata('requireGameAchievement', achievements);

/**
 * Set game streak requirement
 * @param minStreak Minimum streak required
 * @returns Method decorator that sets game streak requirement
 */
export const RequireGameStreak = (minStreak: number) => SetMetadata('requireGameStreak', minStreak);

/**
 * Set game time restriction
 * @param config Time restriction configuration
 * @returns Method decorator that sets game time restriction
 */
export const GameTimeRestriction = (config: { oncePerDay?: boolean; oncePerHour?: boolean; timezone?: string }) =>
	SetMetadata('gameTimeRestriction', config);

/**
 * Set game cooldown period
 * @param cooldownMs Cooldown period in milliseconds
 * @returns Method decorator that sets game cooldown
 */
export const GameCooldown = (cooldownMs: number) => SetMetadata('gameCooldown', cooldownMs);

/**
 * Set game leaderboard requirement
 * @param minRank Minimum leaderboard rank required
 * @returns Method decorator that sets leaderboard requirement
 */
export const RequireLeaderboardRank = (minRank: number) => SetMetadata('requireLeaderboardRank', minRank);
