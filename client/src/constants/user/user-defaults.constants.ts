/**
 * User default values constants for EveryTriv client
 * Defines default values for user creation and initialization
 *
 * @module UserDefaultsConstants
 * @description Default values for user entities and authentication
 * @used_by client/src/hooks/api/useAuth.ts, client/src/components/user/CompleteProfile.tsx, client/src/views/registration/RegistrationView.tsx
 */

import { UserStatus } from '@shared';

/**
 * Default user values for new user creation
 * @constant
 * @description Default values when creating a new user object
 * @used_by client/src/hooks/api/useAuth.ts, client/src/components/user/CompleteProfile.tsx, client/src/views/registration/RegistrationView.tsx
 */
export const USER_DEFAULT_VALUES = {
  /** User status - active by default */
  status: UserStatus.ACTIVE,
  /** Email verification status - false by default */
  emailVerified: false,
  /** Authentication provider - local by default */
  authProvider: 'local' as const,
  /** Initial credits - 0 by default */
  credits: 0,
  /** Initial purchased points - 0 by default */
  purchasedPoints: 0,
  /** Initial total points - 0 by default */
  totalPoints: 0,
} as const;

/**
 * Default point balance values for new users
 * @constant
 * @description Default point balance structure for new users
 * @used_by client/src/redux/slices/userSlice.ts
 */
export const POINT_BALANCE_DEFAULT_VALUES = {
  /** Total points - 0 by default */
  total_points: 0,
  /** Free questions - 0 by default */
  free_questions: 0,
  /** Purchased points - 0 by default */
  purchased_points: 0,
  /** Daily limit - 20 by default */
  daily_limit: 20,
  /** Can play free - false by default */
  can_play_free: false,
  /** Next reset time - null by default */
  next_reset_time: null,
} as const;
