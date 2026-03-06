import type { NavigationLinks } from '@/types';

export const ROUTES = {
	// Public routes
	HOME: '/',
	STATISTICS: '/statistics',

	// Legal and Info routes
	PRIVACY: '/privacy',
	TERMS: '/terms',
	CONTACT: '/contact',

	// Game routes (single vs multi under /game for clear distinction)
	GAME: '/game',
	GAME_SINGLE: '/game/single',
	GAME_SINGLE_PLAY: '/game/single/play/:gameId',
	GAME_SINGLE_SUMMARY: '/game/single/summary/:gameId',
	MULTIPLAYER: '/game/multiplayer',
	MULTIPLAYER_PLAY: '/game/multiplayer/play/:roomId',
	MULTIPLAYER_SUMMARY: '/game/multiplayer/summary/:roomId',

	// Protected routes
	PAYMENT: '/payment',
	COMPLETE_PROFILE: '/complete-profile',
	ADMIN: '/admin',

	// Auth routes
	LOGIN: '/login',
	REGISTER: '/register',
	AUTH_CALLBACK: '/auth/callback',
	AUTH_GOOGLE: '/auth/google',

	// Error routes
	UNAUTHORIZED: '/unauthorized',
} as const;

const MAIN_NAV_LINKS = [
	{ label: 'Start Game', path: ROUTES.GAME },
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
