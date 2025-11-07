/**
 * Navigation constants for EveryTriv
 * Used by both client and server
 *
 * @module NavigationConstants
 * @description Navigation links and routing constants
 * @used_by client/src/constants, client/src/components/navigation
 */

// Navigation links for the application
export const NAVIGATION_LINKS = {
	main: [
		{ label: 'Start Game', path: '/' },
		{ label: 'Leaderboard', path: '/leaderboard' },
		{ label: 'Premium', path: '/payment' },
	],
	authenticated: [
		{ label: 'Game History', path: '/history' },
		{ label: 'Profile', path: '/profile' },
		{ label: 'Analytics', path: '/analytics' },
	],
	admin: [{ label: 'Admin Dashboard', path: '/admin' }],
	footer: {
		quick: [
			{ label: 'Start Game', path: '/' },
			{ label: 'Game History', path: '/history' },
			{ label: 'Leaderboard', path: '/leaderboard' },
			{ label: 'Profile', path: '/profile' },
			{ label: 'Premium', path: '/payment' },
			{ label: 'Analytics', path: '/analytics' },
		],
	},
} as const;

// Type for navigation link
export type NavigationLink = {
	label: string;
	path: string;
};

// Type for all navigation links
export type NavigationLinks = {
	main: readonly NavigationLink[];
	authenticated: readonly NavigationLink[];
	admin: readonly NavigationLink[];
	footer: {
		quick: readonly NavigationLink[];
	};
};

// Route paths
export const ROUTE_PATHS = {
	HOME: '/',
	GAME: '/game',
	LEADERBOARD: '/leaderboard',
	PAYMENT: '/payment',
	HISTORY: '/history',
	PROFILE: '/profile',
	ANALYTICS: '/analytics',
	LOGIN: '/login',
	REGISTER: '/register',
	SETTINGS: '/settings',
} as const;

// Navigation configuration
export const NAVIGATION_CONFIG = {
	ANIMATION_DURATION: 300,
	TRANSITION_TYPE: 'slide',
	ENABLE_BREADCRUMBS: true,
	SHOW_PROGRESS_INDICATOR: true,
} as const;
