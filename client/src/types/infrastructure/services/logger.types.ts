/**
 * Logger Service Types
 * @module LoggerServiceTypes
 * @description Type definitions for logger service with toast integration
 */

/**
 * Toast enabled methods configuration
 * @type ToastEnabledMethods
 * @description Configuration for which logger methods should show toast notifications
 */
export type ToastEnabledMethods = {
	readonly [key: string]: boolean | undefined;
};
