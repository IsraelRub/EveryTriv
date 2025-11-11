/**
 * Animation Constants for EveryTriv
 * Centralized animation configuration for consistent performance and behavior
 *
 * @module AnimationConstants
 * @description Animation configuration, constants, and performance settings
 * @used_by client/src/components/animations, client/src/hooks/layers/ui, client/src/styles
 */

// Animation configuration and constants
export const ANIMATION_CONFIG = {
	DURATION: {
		NORMAL: 0.6,
		SLOW: 1.0,
	},
	EASING: {
		EASE_OUT: [0.4, 0, 0.2, 1],
	},
} as const;

// Accessibility settings
export const ACCESSIBILITY_CONFIG = {
	REDUCED_MOTION: {
		ENABLED: true,
		SCALE_FACTOR: 0.01,
	},
} as const;
