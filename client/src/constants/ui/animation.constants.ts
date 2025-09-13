/**
 * Unified Animation Constants for EveryTriv
 * Centralized animation configuration for consistent performance and behavior
 *
 * @module AnimationConstants
 * @description Animation configuration, constants, and performance settings
 * @used_by client/src/components/animations, client/src/hooks/layers/ui, client/src/styles
 */

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Frame rate settings
  FPS: {
    TARGET: 60,
    THROTTLE_MS: 16, // 1000ms / 60fps
    MIN_UPDATE_INTERVAL: 16,
  },

  // Particle system limits
  PARTICLES: {
    MAX_COUNT: 100,
    DEFAULT_LIMIT: 50,
    BATCH_SIZE: 10,
    LIFETIME: {
      MIN: 1000,
      MAX: 5000,
      DEFAULT: 2000,
    },
  },

  // Animation memory management
  MEMORY: {
    CLEANUP_INTERVAL: 5000, // 5 seconds
    MAX_ANIMATION_DURATION: 10000, // 10 seconds
  },
} as const;

// Animation configuration and constants
export const ANIMATION_CONFIG = {
  // Duration presets
  DURATION: {
    FAST: 0.2,
    NORMAL: 0.6,
    SLOW: 1.0,
    BACKGROUND: 20,
    PARTICLE: 2.0,
    SCORE: 1.0,
  },

  // Easing presets
  EASING: {
    EASE_OUT: [0.4, 0, 0.2, 1],
    EASE_IN: [0.4, 0, 1, 1],
    EASE_IN_OUT: [0.4, 0, 0.2, 1],
    SPRING: { type: 'spring', stiffness: 300, damping: 15 },
    BOUNCE: { type: 'spring', stiffness: 400, damping: 10 },
    ELASTIC: { type: 'spring', stiffness: 200, damping: 8 },
  },

  // Delays for stagger animations
  STAGGER: {
    FAST: 0.05,
    NORMAL: 0.1,
    SLOW: 0.2,
    VERY_SLOW: 0.5,
  },

  // Common animation values
  VALUES: {
    SCALE_HOVER: 1.05,
    SCALE_TAP: 0.95,
    SCALE_FOCUS: 1.02,
    FLOAT_DISTANCE: 10,
    BLUR_DISTANCE: 20,
    ROTATION_ANGLE: 360,
  },

  // Physics settings
  PHYSICS: {
    GRAVITY: 0.1,
    FRICTION: 0.98,
    BOUNCE: 0.8,
    WIND: 0.02,
  },
} as const;

// Color palettes for effects
export const EFFECT_COLORS = {
  CONFETTI: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
    '#D4A5A5',
    '#9B59B6',
    '#F093FB',
  ],

  PULSE: {
    SUCCESS: 'rgba(34, 197, 94, 0.3)',
    ERROR: 'rgba(239, 68, 68, 0.3)',
    INFO: 'rgba(59, 130, 246, 0.3)',
    PRIMARY: 'rgba(102, 126, 234, 0.3)',
    WARNING: 'rgba(245, 158, 11, 0.3)',
  },

  GLOW: {
    BLUE: '0 0 50px rgba(59, 130, 246, 0.3)',
    GREEN: '0 0 50px rgba(34, 197, 94, 0.3)',
    PURPLE: '0 0 50px rgba(147, 51, 234, 0.3)',
    GOLD: '0 0 50px rgba(245, 158, 11, 0.3)',
    RED: '0 0 50px rgba(239, 68, 68, 0.3)',
    ORANGE: '0 0 50px rgba(251, 146, 60, 0.3)',
  },

  PARTICLES: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
    '#D4A5A5',
    '#9B59B6',
    '#F093FB',
  ],

  ORBS: [
    'rgba(59, 130, 246, 0.2)',
    'rgba(147, 51, 234, 0.2)',
    'rgba(34, 197, 94, 0.2)',
    'rgba(245, 158, 11, 0.2)',
  ],

  GRADIENT: {
    START: '#1e3a8a',
    MIDDLE: '#7c3aed',
    END: '#ec4899',
    ACCENT: '#f59e0b',
  },

  INTERACTIVE: 'rgba(59, 130, 246, 0.4)',

  // Semantic colors
  SEMANTIC: {
    SUCCESS: '#22c55e',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
    NEUTRAL: '#6b7280',
  },
} as const;

// Animation variants for common effects
export const ANIMATION_VARIANTS = {
  // Fade effects
  FADE: {
    IN: { opacity: 0 },
    OUT: { opacity: 1 },
    IN_UP: { opacity: 0, y: 20 },
    IN_DOWN: { opacity: 0, y: -20 },
    IN_LEFT: { opacity: 0, x: -20 },
    IN_RIGHT: { opacity: 0, x: 20 },
  },

  // Scale effects
  SCALE: {
    IN: { scale: 0 },
    OUT: { scale: 1 },
    HOVER: { scale: 1.05 },
    TAP: { scale: 0.95 },
  },

  // Slide effects
  SLIDE: {
    UP: { y: '100%' },
    DOWN: { y: '-100%' },
    LEFT: { x: '100%' },
    RIGHT: { x: '-100%' },
  },

  // Rotation effects
  ROTATION: {
    SPIN: { rotate: 360 },
    FLIP_X: { rotateX: 0 },
    FLIP_Y: { rotateY: 0 },
  },
} as const;

// Accessibility settings
export const ACCESSIBILITY_CONFIG = {
  REDUCED_MOTION: {
    ENABLED: true,
    SCALE_FACTOR: 0.01,
    DURATION_FACTOR: 0.01,
  },

  PREFERS_COLOR_SCHEME: {
    LIGHT: 'light',
    DARK: 'dark',
  },
} as const;

// Export all configurations
export default {
  PERFORMANCE_CONFIG,
  ANIMATION_CONFIG,
  EFFECT_COLORS,
  ANIMATION_VARIANTS,
  ACCESSIBILITY_CONFIG,
};
