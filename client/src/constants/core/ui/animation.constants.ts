export const ANIMATION_CONFIG = {
	DURATION: {
		NORMAL: 0.6,
		SLOW: 1.0,
	},
	EASING: {
		EASE_OUT: [0.4, 0, 0.2, 1],
	},
	EASING_NAMES: {
		EASE_OUT: 'easeOut',
		LINEAR: 'linear',
	},
} as const;

export const ANIMATION_DELAYS = {
	STAGGER_EXTRA_SMALL: 0.03,
	STAGGER_SMALL: 0.05,
	STAGGER_NORMAL: 0.1,
	STAGGER_LARGE: 0.2,
	SEQUENCE_STEP: 0.1,
	SEQUENCE_MEDIUM: 0.2,
	SEQUENCE_LARGE: 0.4,
	SEQUENCE_AFTER_HEADER: 0.7,
	SEQUENCE_STATS_BASE: 0.8,
} as const;

export const SPRING_CONFIGS = {
	GENTLE: { stiffness: 150, damping: 15 },
	BOUNCY: { stiffness: 200, damping: 15, mass: 1.5 },
	SMOOTH: { stiffness: 100, damping: 20 },
	ICON_SPRING: { stiffness: 200, damping: 15 },
} as const;

export const TRANSITION_DURATIONS = {
	FAST: 0.3,
	NORMAL: 0.4,
	SMOOTH: 0.5,
	SLOW: 0.6,
} as const;
