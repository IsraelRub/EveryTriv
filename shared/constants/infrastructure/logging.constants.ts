/**
 * Shared logging constants for EveryTriv
 * Used by both client and server
 *
 * @module LoggingConstants
 * @description Logging configuration and formatting constants
 * @used_by server/src/features, client/src/services, shared/services
 */

// Log levels enum
export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
}

// Centralized icon constants
export const LOG_ICONS = {
	// Basic log levels
	ERROR: '🔴',
	WARN: '🟠',
	INFO: '🔵',
	DEBUG: '🟢',

	// Game and user interaction
	FORM: '📋',
	TARGET: '🎯',
	GAMEPAD: '🎮',
	STATISTICS: '📊',
	LINK: '🔗',

	// System and technical
	API: '🌐',
	USER: '👤',
	AUTH: '🔒',
	PAYMENT: '💳',
	DATABASE: '🗄️',
	NAVIGATION: '🧭',
	SECURITY: '🛡️',
	STARTUP: '🚀',
	SHUTDOWN: '🛑',
	HEALTH: '💚',
	CACHE: '💾',
	VALIDATION: '💡',
	ANALYTICS: '📈',
	MEDIA: '🎵',

	// CRUD operations
	CREATE: '➕',
	READ: '👁️',
	UPDATE: '✏️',
	DELETE: '🗑️',

	// Performance
	FAST: '⚡',
	NORMAL: '⏱️',
	SLOW: '🐌',
	CRITICAL: '🚨',

	// HTTP
	SUCCESS: '✅',
	REDIRECT: '🔄',
	CLIENT_ERROR: '❌',
	SERVER_ERROR: '💥',

	// Security
	LOGIN: '🔑',
	LOGOUT: '🚪',
	DENIED: '⛔',

	// Status indicators
	PENDING: '⏳',
	CANCELLED: '🚫',
	EXPIRED: '⌛',
	FAILED: '💣',
} as const;

// Shared log level properties (symbol + console method + colors)
export const LOG_LEVEL_PROPERTIES = {
	[LogLevel.ERROR]: {
		symbol: LOG_ICONS.ERROR,
		consoleMethod: 'error' as const,
		color: 'red',
		priority: 0,
	},
	[LogLevel.WARN]: {
		symbol: LOG_ICONS.WARN,
		consoleMethod: 'warn' as const,
		color: 'yellow',
		priority: 1,
	},
	[LogLevel.INFO]: {
		symbol: LOG_ICONS.INFO,
		consoleMethod: 'log' as const,
		color: 'blue',
		priority: 2,
	},
	[LogLevel.DEBUG]: {
		symbol: LOG_ICONS.DEBUG,
		consoleMethod: 'log' as const,
		color: 'green',
		priority: 3,
	},
} as const;

// Domain definitions - define each domain only once
export const LOG_DOMAINS = {
	OAUTH: 'OAUTH',
	NESTJS: 'NESTJS',
	ENV: 'ENV',
	DATABASE: 'DATABASE',
	LANGUAGE_TOOL: 'LANGUAGE_TOOL',
	PAYMENT: 'PAYMENT',
	SYSTEM: 'SYSTEM',
	NAVIGATION: 'NAVIGATION',
	GAME: 'GAME',
	CACHE: 'CACHE',
	REPOSITORY: 'REPOSITORY',
	ANALYTICS: 'ANALYTICS',
	PROVIDER: 'PROVIDER',
	VALIDATION: 'VALIDATION',
	HTTP: 'HTTP',
	PERFORMANCE: 'PERFORMANCE',

	USER: 'USER',
	AUTH: 'AUTH',
	API: 'API',
	CLIENT: 'CLIENT',
	STORAGE: 'STORAGE',
	TRIVIA: 'TRIVIA',
	MEDIA: 'MEDIA',
} as const;

// Generic domain formatter factory
const createDomainFormatters = (domain: string) => ({
	error: (message: string) => `${LOG_ICONS.ERROR} [${domain}] ${message}`,
	warn: (message: string) => `${LOG_ICONS.WARN} [${domain}] ${message}`,
	info: (message: string) => `${LOG_ICONS.INFO} [${domain}] ${message}`,
	debug: (message: string) => `${LOG_ICONS.DEBUG} [${domain}] ${message}`,
});

// Message formatters for different log types
export const MESSAGE_FORMATTERS = {
	// Generic formatters for different contexts
	context: {
		error: (context: string, message: string) => `${LOG_ICONS.ERROR} ${context} Error: ${message}`,
		warn: (context: string, message: string) => `${LOG_ICONS.WARN} ${context} Warning: ${message}`,
		info: (context: string, message: string) => `${LOG_ICONS.INFO} ${context}: ${message}`,
		debug: (context: string, message: string) => `${LOG_ICONS.DEBUG} ${context} Debug: ${message}`,
	},

	// Performance formatters
	performance: {
		fast: (message: string) => `${LOG_ICONS.FAST} ${message}`,
		normal: (message: string) => `${LOG_ICONS.NORMAL} ${message}`,
		slow: (message: string) => `${LOG_ICONS.SLOW} ${message}`,
		critical: (message: string) => `${LOG_ICONS.CRITICAL} ${message}`,
	},

	// HTTP formatters
	http: {
		success: (message: string) => `${LOG_ICONS.SUCCESS} ${message}`,
		redirect: (message: string) => `${LOG_ICONS.REDIRECT} ${message}`,
		clientError: (message: string) => `${LOG_ICONS.CLIENT_ERROR} ${message}`,
		serverError: (message: string) => `${LOG_ICONS.SERVER_ERROR} ${message}`,
	},

	// Game-specific formatters
	game: {
		form: (message: string) => `${LOG_ICONS.FORM} ${message}`,
		target: (message: string) => `${LOG_ICONS.TARGET} ${message}`,
		gamepad: (message: string) => `${LOG_ICONS.GAMEPAD} ${message}`,
		statistics: (message: string) => `${LOG_ICONS.STATISTICS} ${message}`,
		link: (message: string) => `${LOG_ICONS.LINK} ${message}`,
		error: (message: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.GAME}] ${message}`,
	},

	// Validation formatters
	validation: {
		success: (message: string) => `${LOG_ICONS.VALIDATION} ${message}`,
		error: (message: string) => `${LOG_ICONS.ERROR} ${message}`,
		warn: (message: string) => `${LOG_ICONS.WARN} ${message}`,
		info: (message: string) => `${LOG_ICONS.INFO} ${message}`,
		debug: (message: string) => `${LOG_ICONS.DEBUG} ${message}`,
		field: (field: string, message: string) => `${LOG_ICONS.FORM} ${field}: ${message}`,
		password: (message: string) => `${LOG_ICONS.SECURITY} ${message}`,
		email: (message: string) => `${LOG_ICONS.USER} ${message}`,
		content: (message: string) => `${LOG_ICONS.FORM} ${message}`,
	},

	// Cache formatters
	cache: {
		set: (key: string) => `${LOG_ICONS.CACHE} Cache Set: ${key}`,
		get: (key: string) => `${LOG_ICONS.CACHE} Cache Get: ${key}`,
		hit: (key: string) => `${LOG_ICONS.FAST} Cache Hit: ${key}`,
		miss: (key: string) => `${LOG_ICONS.NORMAL} Cache Miss: ${key}`,
		delete: (key: string) => `${LOG_ICONS.CACHE} Cache Delete: ${key}`,
		invalidation: (pattern: string) => `${LOG_ICONS.CACHE} Cache Invalidation: ${pattern}`,
		warmup: () => `${LOG_ICONS.STARTUP} Cache Warmup`,
		stats: () => `${LOG_ICONS.STATISTICS} Cache Stats`,
		error: (operation: string, key: string) => `${LOG_ICONS.ERROR} Cache ${operation}: ${key}`,
	},

	// Repository formatters
	repository: {
		create: (entity: string, id: string) => `${LOG_ICONS.CREATE} ${entity} Created: ${id}`,
		find: (entity: string, id: string) => `${LOG_ICONS.READ} ${entity} Found: ${id}`,
		update: (entity: string, id: string) => `${LOG_ICONS.UPDATE} ${entity} Updated: ${id}`,
		delete: (entity: string, id: string) => `${LOG_ICONS.DELETE} ${entity} Deleted: ${id}`,
		count: (entity: string, count: number) => `${LOG_ICONS.STATISTICS} ${entity} Count: ${count}`,
		search: (entity: string, criteria: string) => `${LOG_ICONS.READ} ${entity} Search: ${criteria}`,
		error: (operation: string, entity: string, id: string) => `${LOG_ICONS.ERROR} ${entity} ${operation}: ${id}`,
	},

	// Analytics formatters
	analytics: {
		track: (event: string) => `${LOG_ICONS.ANALYTICS} Analytics Track: ${event}`,
		stats: (type: string) => `${LOG_ICONS.ANALYTICS} Analytics Stats: ${type}`,
		metrics: (type: string) => `${LOG_ICONS.ANALYTICS} Analytics Metrics: ${type}`,
		recommendations: () => `${LOG_ICONS.TARGET} Analytics Recommendations`,
		performance: (operation: string) => `${LOG_ICONS.FAST} Analytics Performance: ${operation}`,
		error: (operation: string) => `${LOG_ICONS.ERROR} Analytics Error: ${operation}`,
	},

	// Provider formatters
	provider: {
		stats: (provider: string) => `${LOG_ICONS.STATISTICS} Provider Stats: ${provider}`,
		config: (provider: string) => `${LOG_ICONS.INFO} Provider Config: ${provider}`,
		error: (provider: string, error: string) => `${LOG_ICONS.ERROR} Provider ${provider} Error: ${error}`,
		fallback: (provider: string) => `${LOG_ICONS.WARN} Provider Fallback: ${provider}`,
		success: (provider: string) => `${LOG_ICONS.SUCCESS} Provider Success: ${provider}`,
	},

	// System formatters
	system: {
		...createDomainFormatters(LOG_DOMAINS.SYSTEM),
		startup: () => `${LOG_ICONS.STARTUP} [${LOG_DOMAINS.SYSTEM}] System Startup`,
		shutdown: () => `${LOG_ICONS.SHUTDOWN} [${LOG_DOMAINS.SYSTEM}] System Shutdown`,
		health: () => `${LOG_ICONS.HEALTH} [${LOG_DOMAINS.SYSTEM}] System Health`,
		config: () => `${LOG_ICONS.INFO} [${LOG_DOMAINS.SYSTEM}] System Config`,
		fatal: (message: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.SYSTEM}] FATAL: ${message}`,
		appStartup: () => `${LOG_ICONS.STARTUP} Application startup`,
		appShutdown: () => `${LOG_ICONS.SHUTDOWN} Application shutdown`,
		appConfig: () => `${LOG_ICONS.INFO} Application configuration`,
		message: (message: string) => `${LOG_ICONS.INFO} [${LOG_DOMAINS.SYSTEM}] ${message}`,
	},

	// Navigation formatters
	navigation: {
		page: (path: string) => `${LOG_ICONS.NAVIGATION} Page Navigation: ${path}`,
		route: (route: string) => `${LOG_ICONS.NAVIGATION} Route Change: ${route}`,
		oauth: (provider: string) => `${LOG_ICONS.AUTH} OAuth Navigation: ${provider}`,
		redirect: (from: string, to: string) => `${LOG_ICONS.REDIRECT} Redirect: ${from} → ${to}`,
		error: (path: string, error: string) => `${LOG_ICONS.ERROR} Navigation Error: ${path} - ${error}`,
		notFound: (path: string) => `${LOG_ICONS.ERROR} 404 Not Found: ${path}`,
		unknownRoute: (path: string) => `${LOG_ICONS.WARN} Unknown Route: ${path}`,
		componentError: (component: string, error: string) => `${LOG_ICONS.ERROR} Component Error: ${component} - ${error}`,
	},

	// Payment formatters
	payment: {
		success: (paymentId: string, amount: number) => `${LOG_ICONS.SUCCESS} Payment Success: ${paymentId} (${amount})`,
		processing: (paymentId: string) => `${LOG_ICONS.PENDING} Payment Processing: ${paymentId}`,
		failed: (paymentId: string, error: string) => `${LOG_ICONS.FAILED} Payment Failed: ${paymentId} - ${error}`,
		refunded: (paymentId: string, amount: number) => `${LOG_ICONS.WARN} Payment Refunded: ${paymentId} (${amount})`,
		cancelled: (paymentId: string) => `${LOG_ICONS.CANCELLED} Payment Cancelled: ${paymentId}`,
		expired: (paymentId: string) => `${LOG_ICONS.EXPIRED} Payment Expired: ${paymentId}`,
		webhook: (event: string, paymentId: string) => `${LOG_ICONS.INFO} Payment Webhook: ${event} - ${paymentId}`,
		subscription: (action: string, subscriptionId: string) =>
			`${LOG_ICONS.INFO} Subscription ${action}: ${subscriptionId}`,
		plan: (action: string, planId: string) => `${LOG_ICONS.INFO} Plan ${action}: ${planId}`,
		invoice: (action: string, invoiceId: string) => `${LOG_ICONS.INFO} Invoice ${action}: ${invoiceId}`,
		general: (event: string) => `${LOG_ICONS.PAYMENT} Payment: ${event}`,
		message: (message: string) => `${LOG_ICONS.PAYMENT} ${message}`,
	},

	// Domain-specific formatters using approach
	oauth: {
		error: (provider: string, message: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.OAUTH}:${provider}] ${message}`,
		warn: (provider: string, message: string) => `${LOG_ICONS.WARN} [${LOG_DOMAINS.OAUTH}:${provider}] ${message}`,
		info: (provider: string, message: string) => `${LOG_ICONS.INFO} [${LOG_DOMAINS.OAUTH}:${provider}] ${message}`,
		debug: (provider: string, message: string) => `${LOG_ICONS.DEBUG} [${LOG_DOMAINS.OAUTH}:${provider}] ${message}`,
		credentialsMissing: (provider: string) =>
			`${LOG_ICONS.WARN} [${LOG_DOMAINS.OAUTH}:${provider}] Credentials are not properly configured!`,
		credentialsValid: (provider: string) =>
			`${LOG_ICONS.INFO} [${LOG_DOMAINS.OAUTH}:${provider}] Credentials are configured`,
	},

	// Media formatters with domain and icon
	media: {
		...createDomainFormatters(LOG_DOMAINS.MEDIA),
		load: (key: string) => `${LOG_ICONS.MEDIA} [${LOG_DOMAINS.MEDIA}] Load: ${key}`,
		play: (key: string) => `${LOG_ICONS.MEDIA} [${LOG_DOMAINS.MEDIA}] Play: ${key}`,
		error: (key: string, error: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.MEDIA}] Error: ${key} - ${error}`,
		fallback: (key: string) => `${LOG_ICONS.WARN} [${LOG_DOMAINS.MEDIA}] Fallback: ${key}`,
		audioLoad: (key: string) => `${LOG_ICONS.MEDIA} [${LOG_DOMAINS.MEDIA}] Audio Load: ${key}`,
		audioPlay: (key: string) => `${LOG_ICONS.MEDIA} [${LOG_DOMAINS.MEDIA}] Audio Play: ${key}`,
		audioError: (key: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.MEDIA}] Audio Error: ${key} - ${error}`,
		audioFallback: (key: string) => `${LOG_ICONS.WARN} [${LOG_DOMAINS.MEDIA}] Audio Fallback: ${key}`,
	},

	nestjs: {
		...createDomainFormatters(LOG_DOMAINS.NESTJS),
		appCreated: () => `${LOG_ICONS.INFO} [${LOG_DOMAINS.NESTJS}] Application created successfully`,
	},

	env: createDomainFormatters(LOG_DOMAINS.ENV),

	databaseConnection: {
		error: (message: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.DATABASE}] Connection error: ${message}`,
		success: () => `${LOG_ICONS.INFO} [${LOG_DOMAINS.DATABASE}] Connection established successfully`,
		warning: (message: string) => `${LOG_ICONS.WARN} [${LOG_DOMAINS.DATABASE}] Connection warning: ${message}`,
		debug: (message: string) => `${LOG_ICONS.DEBUG} [${LOG_DOMAINS.DATABASE}] Connection debug: ${message}`,
	},

	// Language Tool specific formatters
	languageTool: {
		...createDomainFormatters(LOG_DOMAINS.LANGUAGE_TOOL),
		validation: (text: string, suggestions: number) =>
			`${LOG_ICONS.FORM} [${LOG_DOMAINS.LANGUAGE_TOOL}] Validation: ${text.substring(0, 50)}... (${suggestions} suggestions)`,
		apiRequest: (endpoint: string) => `${LOG_ICONS.API} [${LOG_DOMAINS.LANGUAGE_TOOL}] API Request: ${endpoint}`,
		apiError: (endpoint: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.LANGUAGE_TOOL}] API Error: ${endpoint} - ${error}`,
		serviceInit: () => `${LOG_ICONS.STARTUP} [${LOG_DOMAINS.LANGUAGE_TOOL}] Service initialized`,
		languagesFetched: (count: number) => `${LOG_ICONS.INFO} [${LOG_DOMAINS.LANGUAGE_TOOL}] Languages fetched: ${count}`,
		fallbackLanguages: (languages: string[]) =>
			`${LOG_ICONS.WARN} [${LOG_DOMAINS.LANGUAGE_TOOL}] Using fallback languages: ${languages.join(', ')}`,
		availabilityCheck: (available: boolean) =>
			`${LOG_ICONS.HEALTH} [${LOG_DOMAINS.LANGUAGE_TOOL}] Service availability: ${available ? 'Available' : 'Unavailable'}`,
	},

	user: {
		...createDomainFormatters(LOG_DOMAINS.USER),
		activity: (action: string) => `${LOG_ICONS.USER} [${LOG_DOMAINS.USER}] Activity: ${action}`,
	},

	auth: {
		login: (message: string) => `${LOG_ICONS.AUTH} [${LOG_DOMAINS.AUTH}] Login: ${message}`,
		logout: (message: string) => `${LOG_ICONS.AUTH} [${LOG_DOMAINS.AUTH}] Logout: ${message}`,
		register: (message: string) => `${LOG_ICONS.CREATE} [${LOG_DOMAINS.AUTH}] Register: ${message}`,
		tokenRefresh: (message: string) => `${LOG_ICONS.REDIRECT} [${LOG_DOMAINS.AUTH}] Token Refresh: ${message}`,
		profileUpdate: (message: string) => `${LOG_ICONS.UPDATE} [${LOG_DOMAINS.AUTH}] Profile Update: ${message}`,
		denied: (message: string) => `${LOG_ICONS.DENIED} [${LOG_DOMAINS.AUTH}] Denied: ${message}`,
		error: (message: string) => `${LOG_ICONS.ERROR} [${LOG_DOMAINS.AUTH}] ${message}`,
		warn: (message: string) => `${LOG_ICONS.WARN} [${LOG_DOMAINS.AUTH}] ${message}`,
		info: (message: string) => `${LOG_ICONS.INFO} [${LOG_DOMAINS.AUTH}] ${message}`,
		debug: (message: string) => `${LOG_ICONS.DEBUG} [${LOG_DOMAINS.AUTH}] ${message}`,
	},
	api: {
		...createDomainFormatters(LOG_DOMAINS.API),
		create: (resource: string) => `${LOG_ICONS.CREATE} [${LOG_DOMAINS.API}] CREATE: ${resource}`,
		read: (resource: string) => `${LOG_ICONS.READ} [${LOG_DOMAINS.API}] READ: ${resource}`,
		update: (resource: string) => `${LOG_ICONS.UPDATE} [${LOG_DOMAINS.API}] UPDATE: ${resource}`,
		delete: (resource: string) => `${LOG_ICONS.DELETE} [${LOG_DOMAINS.API}] DELETE: ${resource}`,
		createError: (resource: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.API}] CREATE ERROR: ${resource} - ${error}`,
		readError: (resource: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.API}] READ ERROR: ${resource} - ${error}`,
		updateError: (resource: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.API}] UPDATE ERROR: ${resource} - ${error}`,
		deleteError: (resource: string, error: string) =>
			`${LOG_ICONS.ERROR} [${LOG_DOMAINS.API}] DELETE ERROR: ${resource} - ${error}`,
	},
	client: createDomainFormatters(LOG_DOMAINS.CLIENT),
	storage: createDomainFormatters(LOG_DOMAINS.STORAGE),
	trivia: createDomainFormatters(LOG_DOMAINS.TRIVIA),
} as const;

/**
 * Performance threshold constants (in milliseconds)
 * @constant
 * @description Performance thresholds for monitoring and alerts
 */
export const PERFORMANCE_THRESHOLDS = {
	ACCEPTABLE: 500, // 500ms - acceptable response time
	SLOW: 1000, // 1s - slow response time
	CRITICAL: 3000, // 3s - critical/very slow response time
} as const;
