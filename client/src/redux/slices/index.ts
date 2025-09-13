/**
 * Redux Features Index
 *
 * @module ReduxFeatures
 * @description Redux slices for state management
 * @used_by client/redux, client/components, client/views
 */

/**
 * Favorites slice
 * @description Redux slice for managing user favorites
 * @used_by client/components, client/views
 */
export { default as favoritesSlice } from './favoritesSlice';

/**
 * Game mode slice
 * @description Redux slice for managing game mode state
 * @used_by client/components/game, client/views
 */
export { default as gameModeSlice } from './gameModeSlice';

/**
 * Game slice
 * @description Redux slice for managing game state
 * @used_by client/components/game, client/views
 */
export { default as gameSlice } from './gameSlice';

/**
 * Stats slice
 * @description Redux slice for managing user statistics
 * @used_by client/components/stats, client/views
 */
export { default as statsSlice } from './statsSlice';

/**
 * User slice
 * @description Redux slice for managing user state
 * @used_by client/components/user, client/views
 */
export { default as userSlice } from './userSlice';

/**
 * User slice actions
 * @description Redux actions for user state management
 * @used_by client/components, client/views
 */
export {
  deductPoints,
  fetchUserData,
  logout,
  setAvatar,
  setPointBalance,
  setUsername,
  updateUserProfile,
} from './userSlice';

/**
 * Selectors
 * @description Redux selectors for state access
 * @used_by client/components, client/hooks
 */
export * from '../selectors';
