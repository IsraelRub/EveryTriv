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
 * @example
 * ```typescript
 * @Get('questions')
 * @GameDifficulty('easy', 'medium')
 * async getQuestions() {
 *   // Endpoint for specific difficulties
 * }
 * ```
 */
export const GameDifficulty = (...difficulties: string[]) => SetMetadata('gameDifficulty', difficulties);

/**
 * Set game mode requirement
 * @param modes Array of required game modes
 * @returns Method decorator that sets game mode requirement
 * @example
 * ```typescript
 * @Get('game-data')
 * @GameMode('classic', 'timed')
 * async getGameData() {
 *   // Endpoint for specific game modes
 * }
 * ```
 */
export const GameMode = (...modes: string[]) => SetMetadata('gameMode', modes);

/**
 * Set points requirement for game action
 * @param minPoints Minimum points required
 * @returns Method decorator that sets points requirement
 * @example
 * ```typescript
 * @Post('premium-question')
 * @RequireGamePoints(50)
 * async getPremiumQuestion() {
 *   // Endpoint requiring minimum points
 * }
 * ```
 */
export const RequireGamePoints = (minPoints: number) => SetMetadata('requireGamePoints', minPoints);

/**
 * Set game session requirement
 * @param requireActive Whether to require active game session
 * @returns Method decorator that sets game session requirement
 * @example
 * ```typescript
 * @Post('game-action')
 * @RequireGameSession(true)
 * async performGameAction() {
 *   // Endpoint requiring active game session
 * }
 * ```
 */
export const RequireGameSession = (requireActive: boolean = true) => SetMetadata('requireGameSession', requireActive);

/**
 * Set game topic requirement
 * @param topics Array of required topics
 * @returns Method decorator that sets game topic requirement
 * @example
 * ```typescript
 * @Get('questions')
 * @GameTopic('science', 'history')
 * async getQuestions() {
 *   // Endpoint for specific topics
 * }
 * ```
 */
export const GameTopic = (...topics: string[]) => SetMetadata('gameTopic', topics);

/**
 * Set game level requirement
 * @param minLevel Minimum game level required
 * @returns Method decorator that sets game level requirement
 * @example
 * ```typescript
 * @Get('advanced-content')
 * @RequireGameLevel(10)
 * async getAdvancedContent() {
 *   // Endpoint for advanced players
 * }
 * ```
 */
export const RequireGameLevel = (minLevel: number) => SetMetadata('requireGameLevel', minLevel);

/**
 * Set game achievement requirement
 * @param achievements Array of required achievements
 * @returns Method decorator that sets game achievement requirement
 * @example
 * ```typescript
 * @Get('exclusive-content')
 * @RequireGameAchievement('first_win', 'streak_10')
 * async getExclusiveContent() {
 *   // Endpoint for players with specific achievements
 * }
 * ```
 */
export const RequireGameAchievement = (...achievements: string[]) => SetMetadata('requireGameAchievement', achievements);

/**
 * Set game streak requirement
 * @param minStreak Minimum streak required
 * @returns Method decorator that sets game streak requirement
 * @example
 * ```typescript
 * @Get('bonus-content')
 * @RequireGameStreak(5)
 * async getBonusContent() {
 *   // Endpoint for players with winning streak
 * }
 * ```
 */
export const RequireGameStreak = (minStreak: number) => SetMetadata('requireGameStreak', minStreak);

/**
 * Set game time restriction
 * @param config Time restriction configuration
 * @returns Method decorator that sets game time restriction
 * @example
 * ```typescript
 * @Get('daily-bonus')
 * @GameTimeRestriction({
 *   oncePerDay: true,
 *   timezone: 'UTC'
 * })
 * async getDailyBonus() {
 *   // Endpoint with daily time restriction
 * }
 * ```
 */
export const GameTimeRestriction = (config: {
	oncePerDay?: boolean;
	oncePerHour?: boolean;
	timezone?: string;
}) => SetMetadata('gameTimeRestriction', config);

/**
 * Set game cooldown period
 * @param cooldownMs Cooldown period in milliseconds
 * @returns Method decorator that sets game cooldown
 * @example
 * ```typescript
 * @Post('power-up')
 * @GameCooldown(30000)
 * async usePowerUp() {
 *   // Endpoint with 30 second cooldown
 * }
 * ```
 */
export const GameCooldown = (cooldownMs: number) => SetMetadata('gameCooldown', cooldownMs);

/**
 * Set game leaderboard requirement
 * @param minRank Minimum leaderboard rank required
 * @returns Method decorator that sets leaderboard requirement
 * @example
 * ```typescript
 * @Get('elite-content')
 * @RequireLeaderboardRank(100)
 * async getEliteContent() {
 *   // Endpoint for top 100 players
 * }
 * ```
 */
export const RequireLeaderboardRank = (minRank: number) => SetMetadata('requireLeaderboardRank', minRank);
