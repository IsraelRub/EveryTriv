/**
 * Size Constants for EveryTriv Client
 *
 * @module SizeConstants
 * @description Centralized size enums and constants for consistent component sizing across the application
 */

/**
 * Base size enum - contains all possible size values
 * @enum {string} BaseSize
 * @description Foundation enum for all size-related enums in the application
 */
export enum BaseSize {
	NONE = 'none',
	XS = 'xs',
	SM = 'sm',
	MD = 'md',
	LG = 'lg',
	XL = 'xl',
	XXL = 'xxl',
}

/**
 * Base component size enum
 * @enum {string} ComponentSize
 * @description Standard size options for UI components
 */
export enum ComponentSize {
	XS = BaseSize.XS,
	SM = BaseSize.SM,
	MD = BaseSize.MD,
	LG = BaseSize.LG,
	XL = BaseSize.XL,
	XXL = BaseSize.XXL,
}

/**
 * Spacing size enum
 * @enum {string} Spacing
 * @description Standard spacing options for padding, margin, and gaps
 */
export enum Spacing {
	NONE = BaseSize.NONE,
	SM = BaseSize.SM,
	MD = BaseSize.MD,
	LG = BaseSize.LG,
	XL = BaseSize.XL,
	XXL = BaseSize.XXL,
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

/**
 * Container size enum
 * @enum {string} ContainerSize
 * @description Size options for container and layout components
 */
export enum ContainerSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	XXL = ComponentSize.XXL,
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
