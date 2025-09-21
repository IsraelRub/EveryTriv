/**
 * Avatar Constants
 *
 * @module AvatarConstants
 * @description Avatar component size definitions, styling constants, and configuration
 * @used_by client/src/components/ui
 */

/**
 * Avatar size definitions with CSS classes and pixel values
 */
export const AVATAR_SIZES = {
  xs: { classes: 'w-6 h-6 text-xs', pixels: 24 },
  sm: { classes: 'w-8 h-8 text-sm', pixels: 32 },
  md: { classes: 'w-12 h-12 text-base', pixels: 48 },
  lg: { classes: 'w-16 h-16 text-lg', pixels: 64 },
  xl: { classes: 'w-20 h-20 text-xl', pixels: 80 },
  '2xl': { classes: 'w-24 h-24 text-2xl', pixels: 96 },
} as const;

/**
 * Avatar size type
 */
export type AvatarSize = keyof typeof AVATAR_SIZES;

/**
 * Avatar background colors for initials fallback
 */
export const AVATAR_BACKGROUND_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
] as const;

/**
 * Avatar configuration constants
 */
export const AVATAR_CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
  GRAVATAR_BASE_URL: 'https://www.gravatar.com/avatar',
  GRAVATAR_DEFAULT: 'identicon',
} as const;
