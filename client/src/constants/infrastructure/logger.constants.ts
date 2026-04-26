export const LOGGER_CSS_COLORS = {
	red: '#ff0000',
	yellow: '#ffaa00',
	blue: '#0066ff',
	green: '#00aa00',
	white: '#ffffff',
	gray: '#888888',
} as const;

export enum ToastEnabledLogMethod {
	USER_ERROR = 'userError',
	AUTH_ERROR = 'authError',
	SYSTEM_ERROR = 'systemError',
	API_ERROR = 'apiError',
	API_UPDATE_ERROR = 'apiUpdateError',
	GAME_ERROR = 'gameError',
	PAYMENT_FAILED = 'paymentFailed',
	SECURITY_ERROR = 'securityError',
	NAVIGATION_COMPONENT_ERROR = 'navigationComponentError',
	PROVIDER_ERROR = 'providerError',
	USER_WARN = 'userWarn',
	SECURITY_WARN = 'securityWarn',
	SECURITY_DENIED = 'securityDenied',
	PROVIDER_FALLBACK = 'providerFallback',
	USER_SUCCESS = 'userSuccess',
	AUTH_SUCCESS = 'authSuccess',
	PAYMENT_SUCCESS = 'paymentSuccess',
}

export const TOAST_ENABLED_METHODS = new Set<string>(Object.values(ToastEnabledLogMethod));
