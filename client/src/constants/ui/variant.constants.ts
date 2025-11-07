/**
 * Variant Constants for EveryTriv Client
 *
 * @module VariantConstants
 * @description Centralized variant enums for consistent component styling across the application
 */

/**
 * Button variant enum
 * @enum {string} ButtonVariant
 * @description Visual style variants for button components
 */
export enum ButtonVariant {
	PRIMARY = 'primary',
	SECONDARY = 'secondary',
	OUTLINE = 'outline',
	GHOST = 'ghost',
	DANGER = 'danger',
	ACCENT = 'accent',
}

/**
 * Card variant enum
 * @enum {string} CardVariant
 * @description Visual style variants for card components
 */
export enum CardVariant {
	GLASS = 'glass',
	WHITE = 'white',
	TRANSPARENT = 'transparent',
	GRAY = 'gray',
	SOLID = 'solid',
	GRADIENT = 'gradient',
}

/**
 * Alert variant enum
 * @enum {string} AlertVariant
 * @description Visual style variants for alert and message components
 */
export enum AlertVariant {
	SUCCESS = 'success',
	ERROR = 'error',
	INFO = 'info',
	WARNING = 'warning',
}

/**
 * Error boundary variant enum
 * @enum {string} ErrorBoundaryVariant
 * @description Display variants for error boundary components
 */
export enum ErrorBoundaryVariant {
	FULLSCREEN = 'fullscreen',
	INLINE = 'inline',
}
