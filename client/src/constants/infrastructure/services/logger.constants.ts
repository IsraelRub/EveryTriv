/**
 * Logger Service Constants
 * @module LoggerServiceConstants
 * @description Constants for logger service with toast integration
 */

import type { ToastEnabledMethods } from '@/types';

/**
 * Logger methods that should show toast notifications
 * Only errors and warnings show toast - success messages are logged but don't show toast
 */
export const TOAST_ENABLED_METHODS: ToastEnabledMethods = {
	// User-facing errors - always show toast
	userError: true,
	authError: true,
	systemError: true,
	apiError: true,
	gameError: true,
	paymentFailed: true,

	// User-facing warnings - show toast
	userWarn: true,
	securityWarn: true,

	// Success messages - logged but no toast (user doesn't need notification for normal operations)
	authLogin: false,
	authRegister: false,
	authLogout: false,
	authProfileUpdate: false,
	payment: false,
	providerSuccess: false,
};
