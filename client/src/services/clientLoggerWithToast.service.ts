/**
 * Client Logger with Toast Integration
 *
 * @module ClientLoggerWithToast
 * @description Extends BaseLoggerService to show toast notifications for user-facing messages
 */
import { BaseLoggerService } from '@shared/services/core/logging/baseLogger.service';
import { LogMeta } from '@shared/types';
import { sanitizeLogMessage } from '@shared/utils';

import { AudioKey } from '@/constants';
import { TOAST_ENABLED_METHODS } from '@/constants/services/logger.constants';
import { toast } from '@/hooks/useToast';
import { audioService } from '@/services';

/**
 * Extract user-friendly message from logger message
 * Removes prefixes like "[User]" or "[Auth]" that are added by formatters
 */
function extractUserMessage(message: string): string {
	return message
		.replace(/^\[User\]\s*/i, '')
		.replace(/^\[Auth\]\s*/i, '')
		.replace(/^\[System\]\s*/i, '')
		.replace(/^\[API\]\s*/i, '')
		.replace(/^\[Game\]\s*/i, '')
		.replace(/^\[Payment\]\s*/i, '')
		.trim();
}

/**
 * Client Logger with Toast Integration
 * Extends BaseLoggerService to show toast notifications for user-facing messages
 */
class ClientLoggerWithToast extends BaseLoggerService {
	private readonly CSS_COLORS = {
		red: '#ff0000',
		yellow: '#ffaa00',
		blue: '#0066ff',
		green: '#00aa00',
		white: '#ffffff',
		gray: '#888888',
	} as const;

	private shouldShowToast(methodName: string): boolean {
		const enabled = TOAST_ENABLED_METHODS[methodName];
		return enabled === true;
	}

	// BaseLogger implementation - console logging
	protected error(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.error(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.red}; font-weight: bold;`, fullMeta);
	}

	protected warn(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.warn(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.yellow}; font-weight: bold;`, fullMeta);
	}

	protected info(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.log(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.blue}; font-weight: bold;`, fullMeta);
	}

	protected debug(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.debug(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.green}; font-weight: bold;`, fullMeta);
	}

	// Override user-facing methods to show toast
	userError(message: string, meta?: LogMeta): void {
		super.userError(message, meta);
		if (this.shouldShowToast('userError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Error',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	}

	userWarn(message: string, meta?: LogMeta): void {
		super.userWarn(message, meta);
		if (this.shouldShowToast('userWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Warning',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	}

	authLogin(message: string, meta?: LogMeta): void {
		super.authLogin(message, meta);
		if (this.shouldShowToast('authLogin')) {
			audioService.play(AudioKey.SUCCESS);
			toast.success({
				title: 'Welcome back!',
				description: 'You have successfully logged in',
				duration: 3000,
			});
		}
	}

	authLogout(message: string, meta?: LogMeta): void {
		super.authLogout(message, meta);
		audioService.play(AudioKey.NOTIFICATION);
		toast.info({
			title: 'Logged out',
			description: 'You have been logged out successfully',
			duration: 3000,
		});
	}

	authRegister(message: string, meta?: LogMeta): void {
		super.authRegister(message, meta);
		if (this.shouldShowToast('authRegister')) {
			audioService.play(AudioKey.SUCCESS);
			toast.success({
				title: 'Account created!',
				description: 'Your account has been created successfully',
				duration: 3000,
			});
		}
	}

	authProfileUpdate(message: string, meta?: LogMeta): void {
		super.authProfileUpdate(message, meta);
		if (this.shouldShowToast('authProfileUpdate')) {
			audioService.play(AudioKey.SUCCESS);
			toast.success({
				title: 'Profile updated',
				description: 'Your profile has been updated successfully',
				duration: 3000,
			});
		}
	}

	authError(messageOrError: string | Error, messageOrMeta?: string | LogMeta, meta?: LogMeta): void {
		super.authError(messageOrError, messageOrMeta, meta);
		if (this.shouldShowToast('authError')) {
			audioService.play(AudioKey.ERROR);
			const errorMessage =
				messageOrError instanceof Error
					? messageOrError.message
					: typeof messageOrMeta === 'string'
						? messageOrMeta
						: messageOrError;
			toast.error({
				title: 'Authentication error',
				description: extractUserMessage(errorMessage),
				duration: 6000,
			});
		}
	}

	systemError(messageOrError: string | Error, messageOrMeta?: string | LogMeta, meta?: LogMeta): void {
		super.systemError(messageOrError, messageOrMeta, meta);
		if (this.shouldShowToast('systemError')) {
			audioService.play(AudioKey.ERROR);
			const errorMessage =
				messageOrError instanceof Error
					? messageOrError.message
					: typeof messageOrMeta === 'string'
						? messageOrMeta
						: messageOrError;
			toast.error({
				title: 'System error',
				description: extractUserMessage(errorMessage),
				duration: 6000,
			});
		}
	}

	apiError(message: string, meta?: LogMeta): void {
		super.apiError(message, meta);
		if (this.shouldShowToast('apiError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Request failed',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	}

	apiUpdateError(resource: string, error: string, meta?: LogMeta): void {
		super.apiUpdateError(resource, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Update failed',
			description: extractUserMessage(error),
			duration: 6000,
		});
	}

	gameError(message: string, meta?: LogMeta): void {
		super.gameError(message, meta);
		if (this.shouldShowToast('gameError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Game error',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	}

	paymentFailed(paymentId: string, error: string, meta?: LogMeta): void {
		super.paymentFailed(paymentId, error, meta);
		if (this.shouldShowToast('paymentFailed')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Payment failed',
				description: extractUserMessage(error),
				duration: 8000,
			});
		}
	}

	payment(message: string, meta?: LogMeta): void {
		super.payment(message, meta);
		if (this.shouldShowToast('payment')) {
			audioService.play(AudioKey.SUCCESS);
			toast.success({
				title: 'Payment successful',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	}

	securityDenied(message: string, meta?: LogMeta): void {
		super.securityDenied(message, meta);
		if (this.shouldShowToast('securityWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Access denied',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	}

	securityWarn(message: string, meta?: LogMeta): void {
		super.securityWarn(message, meta);
		if (this.shouldShowToast('securityWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Security warning',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	}

	securityError(message: string, meta?: LogMeta): void {
		super.securityError(message, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Security error',
			description: extractUserMessage(message),
			duration: 6000,
		});
	}

	navigationComponentError(component: string, error: string, meta?: LogMeta): void {
		super.navigationComponentError(component, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Component error',
			description: `${component}: ${extractUserMessage(error)}`,
			duration: 6000,
		});
	}

	providerError(provider: string, error: string, meta?: LogMeta): void {
		super.providerError(provider, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Service error',
			description: `${provider}: ${extractUserMessage(error)}`,
			duration: 6000,
		});
	}

	providerSuccess(provider: string, meta?: LogMeta): void {
		super.providerSuccess(provider, meta);
		if (this.shouldShowToast('providerSuccess')) {
			audioService.play(AudioKey.SUCCESS);
			toast.success({
				title: 'Success',
				description: `${provider} operation completed successfully`,
				duration: 3000,
			});
		}
	}

	providerFallback(provider: string, meta?: LogMeta): void {
		super.providerFallback(provider, meta);
		audioService.play(AudioKey.WARNING);
		toast.warning({
			title: 'Service fallback',
			description: `Using fallback for ${provider}`,
			duration: 4000,
		});
	}
}

// Export singleton instance
export const clientLogger = new ClientLoggerWithToast();
