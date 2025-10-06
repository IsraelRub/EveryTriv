/**
 * Validation Types
 * @module ValidationTypes
 * @description Validation-related types and interfaces
 */
import { ValidationStatus } from '@shared/types/domain/validation/validation.types';

/**
 * Validation message component props
 * @interface ValidationMessageProps
 * @description Props for displaying validation messages and status indicators
 */
export interface ValidationMessageProps {
  /**
   * Validation message text
   * @description Primary validation message to display
   */
  message?: string;

  /**
   * Validation status
   * @description Current validation state (valid, invalid, pending, etc.)
   */
  status: ValidationStatus;

  /**
   * Additional CSS classes
   * @description Custom styling classes to apply to the component
   */
  className?: string;

  /**
   * Whether to show status icon
   * @description Displays an icon representing the validation status
   * @default true
   */
  showIcon?: boolean;

  /**
   * Error messages array
   * @description List of validation error messages to display
   */
  errors?: string[];

  /**
   * Warning messages array
   * @description List of validation warning messages to display
   */
  warnings?: string[];

  /**
   * Success message text
   * @description Message to show when validation passes
   */
  successMessage?: string;

  /**
   * Whether to show all messages
   * @description Controls visibility of error, warning, and success messages
   * @default true
   */
  showMessages?: boolean;

  /**
   * Message size variant
   * @description Visual size of the validation message
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Animation duration in milliseconds
   * @description Duration for show/hide animations
   * @default 300
   */
  animationDuration?: number;
}

/**
 * Validation icon component props
 * @interface ValidationIconProps
 * @description Props for validation status icons
 */
export interface ValidationIconProps {
  /**
   * Validation status
   * @description Status to determine which icon to display
   */
  status: ValidationStatus;

  /**
   * Icon size variant
   * @description Visual size of the validation icon
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'xl';

  /**
   * Additional CSS classes
   * @description Custom styling classes to apply to the icon
   */
  className?: string;

  /**
   * Whether icon should be animated
   * @description Enables icon animations and transitions
   * @default false
   */
  animated?: boolean;

  /**
   * Custom icon name
   * @description Override default icon for the status
   */
  iconName?: string;

  /**
   * Tooltip text
   * @description Text to show on icon hover
   */
  tooltip?: string;

  /**
   * Whether to show tooltip
   * @description Enables tooltip display on hover
   * @default false
   */
  showTooltip?: boolean;
}

/**
 * Validation status indicator component props
 * @interface ValidationStatusIndicatorProps
 * @description Props for comprehensive validation status display
 */
export interface ValidationStatusIndicatorProps {
  /**
   * Current validation status
   * @description Status to display with appropriate styling
   */
  status: ValidationStatus;

  /**
   * Additional CSS classes
   * @description Custom styling classes to apply to the indicator
   */
  className?: string;

  /**
   * Whether to show status text
   * @description Displays textual representation of the status
   * @default false
   */
  showText?: boolean;

  /**
   * Custom status text
   * @description Override default status text
   */
  statusText?: string;

  /**
   * Previous validation status
   * @description Used for transition animations between states
   */
  previousStatus?: ValidationStatus;

  /**
   * Indicator size variant
   * @description Visual size of the status indicator
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether to show status transitions
   * @description Enables smooth animations between validation states
   * @default true
   */
  showTransitions?: boolean;
}
