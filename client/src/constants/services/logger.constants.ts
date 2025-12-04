/**
 * Logger Service Constants
 * @module LoggerServiceConstants
 * @description Constants for logger service with toast integration
 */

import type { ToastEnabledMethods } from '@/types/services/logger.types';

/**
 * Logger methods that should show toast notifications
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

	// User-facing success messages - show toast
	authLogin: true,
	authRegister: true,
	authProfileUpdate: true,
	payment: true,
	providerSuccess: true,
};
