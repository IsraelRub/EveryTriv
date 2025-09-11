/**
 * Client Components Index
 *
 * @module ClientComponents
 * @description Central export point for all client-side React components and UI elements
 * @author EveryTriv Team
 * @used_by client/views, client/App, client/main
 */

/**
 * Animation components
 * @description Components for visual effects, animations, and dynamic UI elements
 * @used_by client/views, client/components
 */
export * from './animations';

/**
 * Audio components
 * @description Components for sound management, audio controls, and audio feedback
 * @used_by client/views, client/components/game
 */
export * from './audio';

/**
 * Game components
 * @description Components for trivia game functionality and gameplay
 * @used_by client/views/game, client/components
 */
export * from './game';
export * from './gameMode';

/**
 * Icon components
 * @description Reusable icon components and visual elements
 * @used_by client/components, client/views
 */
export * from './icons';

/**
 * Layout components
 * @description Components for page layout, structure, and container elements
 * @used_by client/views, client/App
 */
export * from './layout';

/**
 * Leaderboard components
 * @description Components for displaying rankings, scores, and competitive elements
 * @used_by client/views/leaderboard, client/components
 */
export * from './leaderboard';

/**
 * Navigation components
 * @description Components for navigation, routing, and menu systems
 * @used_by client/views, client/App
 */
export * from './navigation';

/**
 * Statistics components
 * @description Components for displaying user statistics and analytics
 * @used_by client/views/user, client/components
 */
export * from './stats';

/**
 * UI components
 * @description Reusable UI components, primitives, and design system elements
 * @used_by client/components, client/views
 */
export * from './ui';

/**
 * User components
 * @description Components for user profile management and user-related functionality
 * @used_by client/views/user, client/components
 */
export * from './user';
