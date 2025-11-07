/**
 * Avatar Constants
 *
 * @module AvatarConstants
 * @description Avatar component size definitions, styling constants, and configuration
 * @used_by client/src/components/ui
 */

import { ComponentSize } from './size.constants';

/**
 * Avatar size definitions with CSS classes and pixel values
 */
export const AVATAR_SIZES: Record<
	ComponentSize,
	{
		classes: string;
		pixels: number;
	}
> = {
	[ComponentSize.XS]: { classes: 'w-6 h-6 text-xs', pixels: 24 },
	[ComponentSize.SM]: { classes: 'w-8 h-8 text-sm', pixels: 32 },
	[ComponentSize.MD]: { classes: 'w-12 h-12 text-base', pixels: 48 },
	[ComponentSize.LG]: { classes: 'w-16 h-16 text-lg', pixels: 64 },
	[ComponentSize.XL]: { classes: 'w-20 h-20 text-xl', pixels: 80 },
	[ComponentSize.XXL]: { classes: 'w-24 h-24 text-2xl', pixels: 96 },
};

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
	GRAVATAR_BASE_URL: 'https://www.gravatar.com/avatar',
	GRAVATAR_DEFAULT: 'identicon',
} as const;
