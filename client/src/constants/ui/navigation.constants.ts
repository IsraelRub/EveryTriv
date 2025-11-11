import type { NavigationLinks } from '../../types';

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
} as const satisfies NavigationLinks;

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

export const NAVIGATION_CONFIG = {
	ANIMATION_DURATION: 300,
	TRANSITION_TYPE: 'slide',
	ENABLE_BREADCRUMBS: true,
	SHOW_PROGRESS_INDICATOR: true,
} as const;

export const NAVIGATION_CLASSNAMES = {
	wrapper: 'fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-slate-950',
	container: 'flex h-16 items-center justify-between',
	row: 'flex w-full items-center justify-between gap-10',
	desktopSection: 'flex flex-1 items-center justify-between gap-10',
	desktopLinksWrapper: 'flex flex-1 items-center justify-center gap-6',
	audioContainer: 'hidden md:flex items-center gap-4 text-slate-400',
	authContainer: 'flex items-center gap-4',
	userBadge: 'flex items-center gap-2 text-slate-200',
	pointsBadge: 'hidden lg:flex items-center gap-3 text-sm text-slate-400',
	freeQuestionsBadge: 'flex items-center gap-2 text-sm text-emerald-400',
} as const;

export const NAVIGATION_LINK_CLASSNAMES = {
	base: 'text-sm font-medium px-2 py-1 rounded-md transition-colors duration-150',
	active: 'text-white underline underline-offset-8 decoration-2',
	inactive: 'text-slate-400 hover:text-white',
} as const;

export const NAVIGATION_BUTTON_CLASSNAMES = {
	ghost: 'text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors duration-150',
	primary: 'bg-slate-100 text-slate-900 hover:bg-white px-4 py-2 rounded-md font-medium transition-colors duration-150',
	logout: 'text-slate-400 hover:text-white px-3 py-2 rounded-md transition-colors duration-150',
} as const;

export const NAVIGATION_AUDIO_CONTAINER_CLASSNAME =
	'flex items-center gap-2 text-slate-400';

export const NAVIGATION_BRAND_CLASSNAMES = {
	link: 'flex items-center gap-3 text-white hover:text-slate-200 transition-colors duration-150',
	logoWrapper: 'w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center',
	title: 'text-lg font-semibold tracking-tight',
	homeTitle: 'text-lg font-semibold tracking-tight',
	homeWrapper: 'flex items-center gap-3 text-slate-100',
} as const;

