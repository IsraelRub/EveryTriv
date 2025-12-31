/**
 * Client Logger with Toast Integration
 *
 * @module ClientLoggerWithToast
 * @description Extends BaseLoggerService to show toast notifications for user-facing messages
 */
import { BaseLoggerService } from '@shared/services';
import type {
	LogComponentErrorFn,
	LogMessageFn,
	LogMeta,
	LogPaymentErrorFn,
	LogProviderErrorFn,
	LogProviderFn,
	LogResourceErrorFn,
} from '@shared/types';
import { sanitizeLogMessage } from '@shared/utils';
import { AudioKey, TOAST_ENABLED_METHODS } from '@/constants';
import { toast } from '@/hooks';
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
	public userError: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.userError.call(this, message, meta);
		if (this.shouldShowToast('userError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Error',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	};

	public userWarn: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.userWarn.call(this, message, meta);
		if (this.shouldShowToast('userWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Warning',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	};

	public authLogin: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authLogin.call(this, message, meta);
		// No toast for login - user doesn't need notification for normal operations
	};

	public authLogout: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authLogout.call(this, message, meta);
		// No toast for logout - user doesn't need notification for normal operations
	};

	public authRegister: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authRegister.call(this, message, meta);
		// No toast for registration - user doesn't need notification for normal operations
	};

	public authProfileUpdate: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authProfileUpdate.call(this, message, meta);
		// No toast for profile update - user doesn't need notification for normal operations
	};

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

	public apiError: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.apiError.call(this, message, meta);
		if (this.shouldShowToast('apiError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Request failed',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	};

	public apiUpdateError: LogResourceErrorFn = (resource, error, meta) => {
		BaseLoggerService.prototype.apiUpdateError.call(this, resource, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Update failed',
			description: extractUserMessage(error),
			duration: 6000,
		});
	};

	public gameError: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.gameError.call(this, message, meta);
		if (this.shouldShowToast('gameError')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Game error',
				description: extractUserMessage(message),
				duration: 6000,
			});
		}
	};

	public paymentFailed: LogPaymentErrorFn = (paymentId, error, meta) => {
		BaseLoggerService.prototype.paymentFailed.call(this, paymentId, error, meta);
		if (this.shouldShowToast('paymentFailed')) {
			audioService.play(AudioKey.ERROR);
			toast.error({
				title: 'Payment failed',
				description: extractUserMessage(error),
				duration: 8000,
			});
		}
	};

	public paymentInfo: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.paymentInfo.call(this, message, meta);
		// No toast for successful payment - user doesn't need notification for normal operations
		// Payment failures still show toast via paymentFailed method
	};

	public securityDenied: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.securityDenied.call(this, message, meta);
		if (this.shouldShowToast('securityWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Access denied',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	};

	public securityWarn: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.securityWarn.call(this, message, meta);
		if (this.shouldShowToast('securityWarn')) {
			audioService.play(AudioKey.WARNING);
			toast.warning({
				title: 'Security warning',
				description: extractUserMessage(message),
				duration: 5000,
			});
		}
	};

	public securityError: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.securityError.call(this, message, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Security error',
			description: extractUserMessage(message),
			duration: 6000,
		});
	};

	public navigationComponentError: LogComponentErrorFn = (component, error, meta) => {
		BaseLoggerService.prototype.navigationComponentError.call(this, component, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Component error',
			description: `${component}: ${extractUserMessage(error)}`,
			duration: 6000,
		});
	};

	public providerError: LogProviderErrorFn = (provider, error, meta) => {
		BaseLoggerService.prototype.providerError.call(this, provider, error, meta);
		audioService.play(AudioKey.ERROR);
		toast.error({
			title: 'Service error',
			description: `${provider}: ${extractUserMessage(error)}`,
			duration: 6000,
		});
	};

	public providerSuccess: LogProviderFn = (provider, meta) => {
		BaseLoggerService.prototype.providerSuccess.call(this, provider, meta);
		// No toast for provider success - user doesn't need notification for normal operations
	};

	public providerFallback: LogProviderFn = (provider, meta) => {
		BaseLoggerService.prototype.providerFallback.call(this, provider, meta);
		audioService.play(AudioKey.WARNING);
		toast.warning({
			title: 'Service fallback',
			description: `Using fallback for ${provider}`,
			duration: 4000,
		});
	};
}

// Export singleton instance
export const clientLogger = new ClientLoggerWithToast();
