/**
 * UI Components Index
 *
 * @module UIComponents
 * @description Reusable UI components, primitives, and design system elements
 * @author EveryTriv Team
 * @used_by client/components, client/src/views, client/src/forms
 */

/**
 * Avatar component
 * @description Advanced avatar component with fallback system, error handling, and performance optimizations
 * @used_by client/src/components/navigation, client/src/views/user, client/src/components/leaderboard
 */
export { Avatar } from './Avatar';

/**
 * Button component
 * @description Reusable button component with variants, states, and styling options
 * @used_by client/components, client/src/views, client/src/forms
 */
export * from './Button';

/**
 * Card component
 * @description Container component for content sections and layout organization
 * @used_by client/components, client/src/views
 */
export * from './Card';

/**
 * Error boundary component
 * @description Error handling and fallback component for graceful error recovery
 * @used_by client/App, client/components, client/src/views
 */
export { default as ErrorBoundary } from './ErrorBoundary';

/**
 * Input component
 * @description Form input component with validation and styling
 * @used_by client/components, client/src/forms, client/src/views
 */
export * from './Input';

/**
 * Modal component
 * @description Overlay modal component for dialogs and popups
 * @used_by client/components, client/src/views
 */
export * from './Modal';

/**
 * Select component
 * @description Dropdown selection component with options and styling
 * @used_by client/components, client/src/forms, client/src/views
 */
export * from './Select';

/**
 * Validated input component
 * @description Input component with built-in validation and real-time feedback
 * @used_by client/components/forms, client/src/views
 */
export { ValidatedInput } from './ValidatedInput';

/**
 * Validated form component
 * @description Form component with built-in validation and field management
 * @used_by client/components/forms, client/src/views
 */
export { ValidatedForm } from '../forms';

/**
 * Validation message components
 * @description Components for displaying validation messages and feedback
 * @used_by client/components/forms, client/src/views
 */
export {
  ValidationError,
  ValidationLoading,
  ValidationMessage,
  ValidationSuccess,
  ValidationWarning,
} from './ValidationMessage';

/**
 * Validation icon components
 * @description Icon components for validation states and visual feedback
 * @used_by client/components/forms, client/src/views
 */
export {
  ValidationErrorIcon,
  ValidationIcon,
  ValidationLoadingIcon,
  ValidationStatusIndicator,
  ValidationSuccessIcon,
  ValidationWarningIcon,
} from './ValidationIcon';
