/**
 * UI constants index for EveryTriv client
 *
 * @module UIConstants
 * @description Central export point for all UI-related constants and configuration
 * @used_by client/components, client/src/hooks, client/services
 *
 * @methodology Constants Methodology
 * @description Guidelines for using enums vs as const:
 *
 * **Enums** - Use for simple string literal values that need:
 * - Type safety and autocomplete
 * - Compatibility with cva (class-variance-authority)
 * - Clear namespace (e.g., ButtonVariant.DEFAULT)
 * - Action types, field types, variant types
 *
 * Examples: ButtonVariant, ToastVariant, ToastActionType, FormFieldType
 *
 * **as const** - Use for complex structures:
 * - Nested objects (ROUTES, NAVIGATION_LINKS)
 * - Arrays
 * - Configuration objects with mixed values (SCORING_DEFAULTS)
 * - Objects that need spread syntax
 */

/**
 * Form constants
 * @description Form field configurations and validation
 */
export * from './form.constants';

/**
 * Validation messages
 * @description Client-specific validation error messages for UI components
 */
export * from './validation-messages.constants';

/**
 * Animation constants
 * @description Animation configuration and performance settings
 */
export * from './animation.constants';
export * from './backgroundAnimation.constants';
export * from './navigation.constants';
export * from './social.constants';

/**
 * Payment UI constants
 * @description Payment page UI content and features
 */
export * from './payment-ui.constants';

/**
 * Size constants
 * @description Size enums and types for UI components
 */
export * from './size.constants';

/**
 * Variant constants
 * @description Variant enums and types for UI components
 */
export * from './variant.constants';

/**
 * Toast constants
 * @description Toast notification system constants
 */
export * from './toast.constants';

/**
 * Color constants
 * @description Color enums for text and background colors
 */
export * from './color.constants';

/**
 * Easing constants
 * @description Easing function enums for animations
 */
export * from './easing.constants';
