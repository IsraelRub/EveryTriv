/**
 * Animation Components Module
 *
 * @module AnimationComponents
 * @description React components for animations, visual effects, and dynamic UI elements
 * @author EveryTriv Team
 * @used_by client/src/components, client/src/views
 */

/**
 * Animation configuration
 * @description Animation settings, configuration, and effect colors
 * @used_by client/components/animations, client/src/views
 */
export {
  ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG,
  ANIMATION_VARIANTS,
  EFFECT_COLORS,
  PERFORMANCE_CONFIG,
} from '../../constants/ui/animation.constants';

/**
 * Animation library - Variants only
 * @description Collection of animation variants for use with framer-motion
 * @used_by client/components/animations, client/src/views
 */
export * from './AnimationLibrary';

/**
 * Animated background component
 * @description Advanced animated background with particles, orbs, and dynamic effects
 * @used_by client/src/views, client/components
 */
export { default as AnimatedBackground } from './AnimatedBackground';

/**
 * Custom animations hook
 * @description Hook for custom animations with performance optimization and accessibility support
 * @used_by client/hooks/layers/ui, client/components
 */
export { useCustomAnimations } from '../../hooks/layers/ui/useCustomAnimations';
