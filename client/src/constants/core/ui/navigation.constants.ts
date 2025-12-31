import type { NavigationLinks } from '@/types';

/**
 * Application route constants
 * @description Centralized route paths for the entire application
 */
export const ROUTES = {
	// Public routes
	HOME: '/',
	PLAY: '/play',
	START: '/start',
	STATISTICS: '/statistics',
	LEADERBOARD: '/leaderboard',

	// Legal and Info routes
	PRIVACY: '/privacy',
	TERMS: '/terms',
	CONTACT: '/contact',

	// Game routes
	GAME: '/game',
	GAME_PLAY: '/game/play',
	GAME_SUMMARY: '/game/summary',
	GAME_CUSTOM: '/game/custom',

	// Multiplayer routes
	MULTIPLAYER: '/multiplayer',
	MULTIPLAYER_GAME: '/multiplayer/game/:roomId',
	MULTIPLAYER_RESULTS: '/multiplayer/results/:roomId',

	// Protected routes
	PAYMENT: '/payment',
	COMPLETE_PROFILE: '/complete-profile',
	ADMIN: '/admin',

	// Auth routes
	LOGIN: '/login',
	REGISTER: '/register',
	AUTH_CALLBACK: '/auth/callback',
	AUTH_GOOGLE: '/auth/google',
	FORGOT_PASSWORD: '/forgot-password',

	// Error routes
	UNAUTHORIZED: '/unauthorized',
} as const;

const MAIN_NAV_LINKS = [
	{ label: 'Start Game', path: ROUTES.HOME },
	{ label: 'Statistics', path: ROUTES.STATISTICS },
] as const;

const LEGAL_LINKS = [
	{ label: 'Privacy Policy', path: ROUTES.PRIVACY },
	{ label: 'Terms of Service', path: ROUTES.TERMS },
	{ label: 'Contact', path: ROUTES.CONTACT },
] as const;

export const NAVIGATION_LINKS: NavigationLinks = {
	main: MAIN_NAV_LINKS,
	authenticated: [],
	admin: [{ label: 'Admin Dashboard', path: ROUTES.ADMIN }],
	footer: {
		quick: MAIN_NAV_LINKS,
		legal: LEGAL_LINKS,
	},
};
