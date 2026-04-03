import { LogLevel, TIME_PERIODS_MS } from '@shared/constants';
import { BaseLoggerService } from '@shared/services';
import type { LogMessageFn, LogMeta } from '@shared/types';
import { getErrorMessage, sanitizeLogMessage } from '@shared/utils';

import { AudioKey, LOGGER_CSS_COLORS, TOAST_ENABLED_METHODS, ToastType } from '@/constants';
import type {
	LogComponentErrorFn,
	LogPaymentErrorFn,
	LogProviderErrorFn,
	LogProviderFn,
	LogResourceErrorFn,
	ToastOptions,
} from '@/types';
import { audioService } from '@/services';
import { toast } from '@/hooks';

class ClientLoggerService extends BaseLoggerService {
	private extractUserMessage(message: string): string {
		return message
			.replace(/^\[User\]\s*/i, '')
			.replace(/^\[Auth\]\s*/i, '')
			.replace(/^\[System\]\s*/i, '')
			.replace(/^\[API\]\s*/i, '')
			.replace(/^\[Game\]\s*/i, '')
			.replace(/^\[Payment\]\s*/i, '')
			.trim();
	}

	// BaseLogger implementation - console logging
	protected error(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.error(`%c${sanitizedMessage}`, `color: ${LOGGER_CSS_COLORS.red}; font-weight: bold;`, fullMeta);
	}

	protected warn(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.warn(`%c${sanitizedMessage}`, `color: ${LOGGER_CSS_COLORS.yellow}; font-weight: bold;`, fullMeta);
	}

	protected info(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.log(`%c${sanitizedMessage}`, `color: ${LOGGER_CSS_COLORS.blue}; font-weight: bold;`, fullMeta);
	}

	protected debug(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.debug(`%c${sanitizedMessage}`, `color: ${LOGGER_CSS_COLORS.green}; font-weight: bold;`, fullMeta);
	}

	private log(
		level: LogLevel,
		message: string,
		meta?: LogMeta,
		options?: {
			baseMethod?: (msg: string, m?: LogMeta) => void;
			toast?: ToastOptions & { type: ToastType; enabled?: boolean };
		}
	): void {
		// Call base logger method if provided
		if (options?.baseMethod) {
			options.baseMethod(message, meta);
		} else {
			// Fallback to direct level call
			this[level](message, meta);
		}

		// Show toast if enabled
		if (options?.toast?.enabled !== false && TOAST_ENABLED_METHODS.has(level)) {
			const toastConfig = options?.toast;
			if (toastConfig?.audioKey) {
				audioService.play(toastConfig.audioKey);
			}

			const toastFn = toast[toastConfig?.type ?? ToastType.ERROR];
			toastFn({
				title: toastConfig?.title ?? 'Error',
				description: this.extractUserMessage(message),
				duration: toastConfig?.duration ?? TIME_PERIODS_MS.FIVE_SECONDS,
			});
		}
	}

	// User-facing methods
	public userError: LogMessageFn = (message, meta) => {
		this.log(LogLevel.ERROR, message, meta, {
			baseMethod: BaseLoggerService.prototype.userError.bind(this),
			toast: {
				type: ToastType.ERROR,
				title: 'Error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('userError'),
			},
		});
	};

	public userWarn: LogMessageFn = (message, meta) => {
		this.log(LogLevel.WARN, message, meta, {
			baseMethod: BaseLoggerService.prototype.userWarn.bind(this),
			toast: {
				type: ToastType.WARNING,
				title: 'Warning',
				audioKey: AudioKey.WARNING,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('userWarn'),
			},
		});
	};

	public userSuccess: LogMessageFn = (message, meta) => {
		this.log(LogLevel.INFO, message, meta, {
			baseMethod: BaseLoggerService.prototype.userInfo.bind(this),
			toast: {
				type: ToastType.SUCCESS,
				title: 'Success',
				audioKey: AudioKey.SUCCESS,
				duration: TIME_PERIODS_MS.THREE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('userSuccess'),
			},
		});
	};

	// Auth methods - no toast for normal operations
	public authLogin: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authLogin.call(this, message, meta);
	};

	public authLogout: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authLogout.call(this, message, meta);
	};

	public authRegister: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authRegister.call(this, message, meta);
	};

	public authProfileUpdate: LogMessageFn = (message, meta) => {
		BaseLoggerService.prototype.authProfileUpdate.call(this, message, meta);
	};

	public authError(messageOrError: string | Error, meta?: LogMeta): void {
		super.authError(messageOrError, meta);
		const message = messageOrError instanceof Error ? getErrorMessage(messageOrError) : messageOrError;
		this.log(LogLevel.ERROR, message, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'Authentication error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('authError'),
			},
		});
	}

	public authSuccess: LogMessageFn = (message, meta) => {
		this.log(LogLevel.INFO, message, meta, {
			baseMethod: BaseLoggerService.prototype.authInfo.bind(this),
			toast: {
				type: ToastType.SUCCESS,
				title: 'Success',
				audioKey: AudioKey.SUCCESS,
				duration: TIME_PERIODS_MS.THREE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('authSuccess'),
			},
		});
	};

	// System methods
	public systemError(messageOrError: string | Error, meta?: LogMeta): void {
		super.systemError(messageOrError, meta);
		const message = messageOrError instanceof Error ? getErrorMessage(messageOrError) : messageOrError;
		this.log(LogLevel.ERROR, message, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'System error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('systemError'),
			},
		});
	}

	// API methods
	public apiError: LogMessageFn = (message, meta) => {
		this.log(LogLevel.ERROR, message, meta, {
			baseMethod: BaseLoggerService.prototype.apiError.bind(this),
			toast: {
				type: ToastType.ERROR,
				title: 'Request failed',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('apiError'),
			},
		});
	};

	public apiUpdateError: LogResourceErrorFn = (resource, error, meta) => {
		BaseLoggerService.prototype.apiUpdateError.call(this, resource, error, meta);
		this.log(LogLevel.ERROR, error, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'Update failed',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('apiUpdateError'),
			},
		});
	};

	// Game methods
	public gameError: LogMessageFn = (message, meta) => {
		this.log(LogLevel.ERROR, message, meta, {
			baseMethod: BaseLoggerService.prototype.gameError.bind(this),
			toast: {
				type: ToastType.ERROR,
				title: 'Game error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('gameError'),
			},
		});
	};

	// Payment methods
	public paymentFailed: LogPaymentErrorFn = (paymentId, error, meta) => {
		BaseLoggerService.prototype.paymentFailed.call(this, paymentId, error, meta);
		this.log(LogLevel.ERROR, error, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'Payment failed',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.EIGHT_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('paymentFailed'),
			},
		});
	};

	public paymentSuccess: LogMessageFn = (message, meta) => {
		this.log(LogLevel.INFO, message, meta, {
			baseMethod: BaseLoggerService.prototype.paymentInfo.bind(this),
			toast: {
				type: ToastType.SUCCESS,
				title: 'Payment Successful',
				audioKey: AudioKey.SUCCESS,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('paymentSuccess'),
			},
		});
	};

	// Security methods
	public securityDenied: LogMessageFn = (message, meta) => {
		this.log(LogLevel.WARN, message, meta, {
			baseMethod: BaseLoggerService.prototype.securityDenied.bind(this),
			toast: {
				type: ToastType.WARNING,
				title: 'Access denied',
				audioKey: AudioKey.WARNING,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('securityDenied'),
			},
		});
	};

	public securityWarn: LogMessageFn = (message, meta) => {
		this.log(LogLevel.WARN, message, meta, {
			baseMethod: BaseLoggerService.prototype.securityWarn.bind(this),
			toast: {
				type: ToastType.WARNING,
				title: 'Security warning',
				audioKey: AudioKey.WARNING,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('securityWarn'),
			},
		});
	};

	public securityError: LogMessageFn = (message, meta) => {
		this.log(LogLevel.ERROR, message, meta, {
			baseMethod: BaseLoggerService.prototype.securityError.bind(this),
			toast: {
				type: ToastType.ERROR,
				title: 'Security error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('securityError'),
			},
		});
	};

	// Component methods
	public navigationComponentError: LogComponentErrorFn = (component, error, meta) => {
		BaseLoggerService.prototype.navigationComponentError.call(this, component, error, meta);
		this.log(LogLevel.ERROR, `${component}: ${error}`, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'Component error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('navigationComponentError'),
			},
		});
	};

	// Provider methods
	public providerError: LogProviderErrorFn = (provider, error, meta) => {
		BaseLoggerService.prototype.providerError.call(this, provider, error, meta);
		this.log(LogLevel.ERROR, `${provider}: ${error}`, meta, {
			toast: {
				type: ToastType.ERROR,
				title: 'Service error',
				audioKey: AudioKey.ERROR,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('providerError'),
			},
		});
	};

	public providerSuccess: LogProviderFn = (provider, meta) => {
		BaseLoggerService.prototype.providerSuccess.call(this, provider, meta);
		// No toast for provider success - user doesn't need notification for normal operations
	};

	public providerFallback: LogProviderFn = (provider, meta) => {
		BaseLoggerService.prototype.providerFallback.call(this, provider, meta);
		this.log(LogLevel.WARN, `Using fallback for ${provider}`, meta, {
			toast: {
				type: ToastType.WARNING,
				title: 'Service fallback',
				audioKey: AudioKey.WARNING,
				duration: TIME_PERIODS_MS.FIVE_SECONDS,
				enabled: TOAST_ENABLED_METHODS.has('providerFallback'),
			},
		});
	};
}

export const clientLogger = new ClientLoggerService();
