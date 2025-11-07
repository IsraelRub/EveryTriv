import { Variants } from 'framer-motion';

import { ACCESSIBILITY_CONFIG, ANIMATION_CONFIG } from '../../constants';

/**
 * Animation Library
 * Provides animation variants for use with framer-motion
 *
 * @module AnimationLibrary
 * @description Collection of animation variants and utilities
 */

// Enhanced animation variants with accessibility support
export const fadeInUp: Variants = {
	hidden: {
		opacity: 0,
		y: 15,
		scale: 0.98,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.3,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const fadeInDown: Variants = {
	hidden: {
		opacity: 0,
		y: -15,
		scale: 0.98,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.3,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const fadeInLeft: Variants = {
	hidden: {
		opacity: 0,
		x: -15,
		scale: 0.98,
	},
	visible: {
		opacity: 1,
		x: 0,
		scale: 1,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.3,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const fadeInRight: Variants = {
	hidden: {
		opacity: 0,
		x: 15,
		scale: 0.98,
	},
	visible: {
		opacity: 1,
		x: 0,
		scale: 1,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.3,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const scaleIn: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.9,
		rotate: -2,
	},
	visible: {
		opacity: 1,
		scale: 1,
		rotate: 0,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.4,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const slideInUp: Variants = {
	hidden: {
		opacity: 0,
		y: 50,
		scale: 0.9,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? ANIMATION_CONFIG.DURATION.SLOW * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: ANIMATION_CONFIG.DURATION.SLOW,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

export const hoverScale: Variants = {
	initial: {
		scale: 1,
		transition: { duration: 0.2 },
	},
	hover: {
		scale: 1.02,
		transition: {
			duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? 0.2 * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
				: 0.2,
			ease: ANIMATION_CONFIG.EASING.EASE_OUT,
		},
	},
};

// Enhanced stagger container with dynamic delay calculation
export const createStaggerContainer = (
	delay: number = 0.05,
	maxDelay: number = 0.2 // Maximum delay to prevent too slow animations
): Variants => ({
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
				? Math.min(delay * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR, maxDelay)
				: Math.min(delay, maxDelay),
		},
	},
});
