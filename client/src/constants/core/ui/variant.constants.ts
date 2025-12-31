/**
 * Variant Constants for EveryTriv Client
 *
 * @module VariantConstants
 * @description Centralized variant enums and constants for consistent component variants across the application
 */

/**
 * Base variant enum
 * @enum {string} VariantBase
 * @description Common variant values shared across multiple components
 */
export enum VariantBase {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
	OUTLINE = 'outline',
	SECONDARY = 'secondary',
}

/**
 * Button variant enum
 * @enum {string} ButtonVariant
 * @description Variant options for Button components
 * Includes all base variants plus Button-specific variants
 */
export enum ButtonVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	OUTLINE = VariantBase.OUTLINE,
	SECONDARY = VariantBase.SECONDARY,
	GHOST = 'ghost',
}

/**
 * Stat Card variant enum
 * @enum {string} StatCardVariant
 * @description Variant options for StatCard components
 * Unique variants not shared with other components
 */
export enum StatCardVariant {
	HORIZONTAL = 'horizontal',
	VERTICAL = 'vertical',
	CENTERED = 'centered',
}

/**
 * Toast variant enum
 * @enum {string} ToastVariant
 * @description Variant options for Toast components
 * Includes base variants plus Toast-specific variants
 */
export enum ToastVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	SUCCESS = 'success',
	WARNING = 'warning',
	INFO = 'info',
}

/**
 * Spinner variant enum
 * @enum {string} SpinnerVariant
 * @description Variant options for Spinner components
 * Different visual styles for different use cases
 */
export enum SpinnerVariant {
	FULL_SCREEN = 'fullScreen',
	BUTTON = 'button',
	REFRESH = 'refresh',
}
