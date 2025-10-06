import { Variants } from 'framer-motion';

import { ACCESSIBILITY_CONFIG, ANIMATION_CONFIG } from '../../constants/ui/animation.constants';

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
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.NORMAL,
      ease: ANIMATION_CONFIG.EASING.EASE_OUT,
    },
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.NORMAL,
      ease: ANIMATION_CONFIG.EASING.EASE_OUT,
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.NORMAL,
      ease: ANIMATION_CONFIG.EASING.EASE_OUT,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.NORMAL,
      ease: ANIMATION_CONFIG.EASING.EASE_OUT,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.NORMAL * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.NORMAL,
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
    transition: { duration: ANIMATION_CONFIG.DURATION.FAST },
  },
  hover: {
    scale: ANIMATION_CONFIG.VALUES.SCALE_HOVER,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.FAST * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.FAST,
      ease: ANIMATION_CONFIG.EASING.EASE_OUT,
    },
  },
};

export const tapScale: Variants = {
  initial: { scale: 1 },
  tap: {
    scale: ANIMATION_CONFIG.VALUES.SCALE_TAP,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.FAST * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.FAST,
    },
  },
};

export const focusScale: Variants = {
  initial: { scale: 1 },
  focus: {
    scale: ANIMATION_CONFIG.VALUES.SCALE_FOCUS,
    transition: {
      duration: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? ANIMATION_CONFIG.DURATION.FAST * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : ANIMATION_CONFIG.DURATION.FAST,
    },
  },
};

// Enhanced stagger container
export const createStaggerContainer = (
  delay: number = ANIMATION_CONFIG.STAGGER.NORMAL
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ACCESSIBILITY_CONFIG.REDUCED_MOTION.ENABLED
        ? delay * ACCESSIBILITY_CONFIG.REDUCED_MOTION.SCALE_FACTOR
        : delay,
    },
  },
});

// Export all variants
export default {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInUp,
  hoverScale,
  tapScale,
  focusScale,
  createStaggerContainer,
};
