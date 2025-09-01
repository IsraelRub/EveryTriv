/**
 * Animation Components Module
 *
 * @module AnimationComponents
 * @description React components for animations, visual effects, and dynamic UI elements
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/components, client/views
 */

/**
 * Animation configuration
 * @description Animation settings, configuration, and effect colors
 * @used_by client/components/animations, client/views
 * @deprecated Use 'everytriv-shared/constants/animation.constants' instead
 */
export { ANIMATION_CONFIG, EFFECT_COLORS } from '../../constants/animation.constants';

/**
 * Animation effects
 * @description Reusable animation effects, transitions, and motion components
 * @used_by client/components, client/views
 */
export * from './AnimationEffects';

/**
 * Animation library
 * @description Collection of animation components, utilities, and motion variants
 * @used_by client/components, client/views
 */
export * from './AnimationLibrary';

/**
 * Animated background component
 * @description Advanced animated background with particles, orbs, and dynamic effects
 * @used_by client/views, client/components
 */
export { default as AnimatedBackground } from './AnimatedBackground';
