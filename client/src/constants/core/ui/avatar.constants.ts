/**
 * Avatar Constants
 *
 * @module AvatarConstants
 * @description Avatar component size definitions, styling constants, and configuration
 * @used_by client/src/components/ui
 */
import type { AvatarOption } from '@shared/types';

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
 * Avatar configuration constants
 */
export const AVATAR_CONFIG = {
	MIN_AVATAR_ID: 1,
	MAX_AVATAR_ID: 16,
	DEFAULT_AVATAR_ID: 2,
} as const;

/**
 * Available avatars list (IDs only, URLs are generated dynamically)
 */
export const AVAILABLE_AVATARS: AvatarOption[] = Array.from({ length: AVATAR_CONFIG.MAX_AVATAR_ID }, (_, i) => ({
	id: i + 1,
}));
