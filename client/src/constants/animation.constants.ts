/**
 * Animation constants for EveryTriv
 * Used by both client and server
 *
 * @module AnimationConstants
 * @description Animation configuration and constants for UI animations
 * @used_by client/src/components/animations/AnimationConfig.ts (animation configuration), client/src/components/ui (UI animations)
 */

// Animation configuration and constants
export const ANIMATION_CONFIG = {
	// Duration presets
	DURATION: {
		FAST: 0.3,
		NORMAL: 0.6,
		SLOW: 1.0,
		BACKGROUND: 20,
	},

	// Easing presets
	EASING: {
		EASE_OUT: [0.4, 0, 0.2, 1],
		EASE_IN: [0.4, 0, 1, 1],
		EASE_IN_OUT: [0.4, 0, 0.2, 1],
		SPRING: { type: 'spring', stiffness: 300, damping: 15 },
		BOUNCE: { type: 'spring', stiffness: 400, damping: 10 },
	},

	// Delays for stagger animations
	STAGGER: {
		FAST: 0.05,
		NORMAL: 0.1,
		SLOW: 0.2,
	},

	// Common animation values
	VALUES: {
		SCALE_HOVER: 1.05,
		SCALE_TAP: 0.95,
		FLOAT_DISTANCE: 10,
		BLUR_DISTANCE: 20,
	},
} as const;

// Color palettes for effects
export const EFFECT_COLORS = {
	CONFETTI: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#F093FB'],

	PULSE: {
		SUCCESS: 'rgba(34, 197, 94, 0.3)',
		ERROR: 'rgba(239, 68, 68, 0.3)',
		INFO: 'rgba(59, 130, 246, 0.3)',
		PRIMARY: 'rgba(102, 126, 234, 0.3)',
	},

	GLOW: {
		BLUE: '0 0 50px rgba(59, 130, 246, 0.3)',
		GREEN: '0 0 50px rgba(34, 197, 94, 0.3)',
		PURPLE: '0 0 50px rgba(147, 51, 234, 0.3)',
		GOLD: '0 0 50px rgba(245, 158, 11, 0.3)',
	},

	PARTICLES: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#F093FB'],

	ORBS: ['rgba(59, 130, 246, 0.2)', 'rgba(147, 51, 234, 0.2)', 'rgba(34, 197, 94, 0.2)', 'rgba(245, 158, 11, 0.2)'],

	GRADIENT: {
		START: '#1e3a8a',
		MIDDLE: '#7c3aed',
		END: '#ec4899',
	},

	INTERACTIVE: 'rgba(59, 130, 246, 0.4)',
} as const;
