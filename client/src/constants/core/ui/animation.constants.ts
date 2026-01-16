export const ANIMATION_CONFIG = {
	DURATION: {
		NORMAL: 0.6,
		SLOW: 1.0,
	},
	EASING: {
		EASE_OUT: [0.4, 0, 0.2, 1],
	},
} as const;

export const ACCESSIBILITY_CONFIG = {
	REDUCED_MOTION: {
		ENABLED: true,
		SCALE_FACTOR: 0.01,
	},
} as const;

export enum IconAnimationType {
	BOUNCE = 'bounce',
	PULSE = 'pulse',
	ROTATE = 'rotate',
	SHAKE = 'shake',
	NONE = 'none',
}
