export const LOGGER_CSS_COLORS = {
	red: '#ff0000',
	yellow: '#ffaa00',
	blue: '#0066ff',
	green: '#00aa00',
	white: '#ffffff',
	gray: '#888888',
} as const;

export const TOAST_ENABLED_METHODS = new Set<string>([
	// User-facing errors
	'userError',
	'authError',
	'systemError',
	'apiError',
	'apiUpdateError',
	'gameError',
	'paymentFailed',
	'securityError',
	'navigationComponentError',
	'providerError',
	// User-facing warnings
	'userWarn',
	'securityWarn',
	'securityDenied',
	'providerFallback',
	// User-facing success (optional, use sparingly for important actions)
	'userSuccess',
	'authSuccess',
	'paymentSuccess',
]);
