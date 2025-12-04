/**
 * Redux Features Index
 *
 * @module ReduxFeatures
 * @description Redux slices for state management
 * @used_by client/src/redux, client/src/components, client/src/views
 */

/**
 * Favorites slice
 * @description Redux slice for managing user favorites
 * @used_by client/src/components, client/src/views
 */
export { default as favoritesSlice } from './favoritesSlice';

/**
 * Game mode slice
 * @description Redux slice for managing game mode state
 * @used_by client/src/components/game, client/src/views
 */
export { default as gameModeSlice, setGameMode, resetGameMode } from './gameModeSlice';

/**
 * Game slice
 * @description Redux slice for managing game state
 * @used_by client/src/components/game, client/src/views
 */
export { default as gameSlice } from './gameSlice';
export { resetGame, updateScore } from './gameSlice';

/**
 * Stats slice
 * @description Redux slice for managing user statistics
 * @used_by client/src/components/stats, client/src/views
 */
export { default as statsSlice } from './statsSlice';

/**
 * User slice
 * @description Redux slice for managing user state
 * @used_by client/src/components/user, client/src/views
 */
export { default as userSlice } from './userSlice';

/**
 * User slice actions
 * @description Redux actions for user state management
 * @used_by client/src/components, client/src/views
 */
export {
	deductCredits,
	fetchUserData,
	setAvatar,
	setAuthenticated,
	setCreditBalance,
	setUser,
	updateUserProfile,
} from './userSlice';

/**
 * Selectors
 * @description Redux selectors for state access
 * @used_by client/src/components, client/hooks
 */
export * from '../selectors';
