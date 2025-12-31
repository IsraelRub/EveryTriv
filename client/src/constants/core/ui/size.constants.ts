/**
 * Size Constants for EveryTriv Client
 *
 * @module SizeConstants
 * @description Centralized size enums and constants for consistent component sizing across the application
 */

/**
 * Base component size enum
 * @enum {string} ComponentSize
 * @description Standard size options for UI components
 */
export enum ComponentSize {
	XS = 'xs',
	SM = 'sm',
	MD = 'md',
	LG = 'lg',
	XL = 'xl',
	XXL = 'xxl',
}

/**
 * Modal size enum
 * @enum {string} ModalSize
 * @description Size options for modal components
 */
export enum ModalSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	FULL = 'full',
}

// Interactive components size type (buttons, inputs)
export type InteractiveSize = ComponentSize.SM | ComponentSize.MD | ComponentSize.LG;

/**
 * Button size enum
 * @enum {string} ButtonSize
 * @description Size options specifically for Button components
 */
export enum ButtonSize {
	DEFAULT = 'default',
	SM = ComponentSize.SM,
	LG = ComponentSize.LG,
	ICON = 'icon',
}

/**
 * Spinner size enum
 * @enum {string} SpinnerSize
 * @description Size options specifically for Spinner components
 */
export enum SpinnerSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	FULL = 'full',
}
