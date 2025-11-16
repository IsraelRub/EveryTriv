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
	wrapper: 'fixed top-0 left-0 right-0 z-40 border-b border-slate-900/80 bg-slate-950/95 backdrop-blur-sm',
	container: 'flex h-16 items-center justify-between xl:h-20 xl:px-16 2xl:px-24 xl:max-w-[1720px] 2xl:max-w-[1920px]',
	row: 'flex w-full items-center justify-between gap-8 xl:gap-12 2xl:gap-16',
	desktopSection: 'flex flex-1 items-center justify-between gap-6 xl:gap-10 2xl:gap-12',
	desktopLinksWrapper: 'flex flex-1 items-center justify-center gap-4 xl:gap-6 2xl:gap-8',
	audioContainer: 'hidden md:flex items-center gap-3 xl:gap-4 2xl:gap-5 text-slate-400',
	authContainer: 'flex items-center gap-3 xl:gap-4 2xl:gap-5',
	userBadge: 'flex items-center gap-2 xl:gap-3 text-slate-200 text-sm xl:text-base',
	pointsBadge:
		'hidden lg:flex items-center gap-2 xl:gap-3 text-sm xl:text-base text-slate-300 bg-slate-900/60 px-3 xl:px-4 py-1.5 xl:py-2 rounded-lg shadow-lg shadow-black/20',
	freeQuestionsBadge:
		'flex items-center gap-2 xl:gap-3 text-sm xl:text-base text-emerald-300 bg-slate-900/60 px-3 xl:px-4 py-1.5 xl:py-2 rounded-lg',
} as const;

export const NAVIGATION_LINK_CLASSNAMES = {
	base: 'text-sm xl:text-base font-medium px-2 py-1 xl:px-3 xl:py-2 rounded-md transition-colors duration-150',
	active: 'text-white underline underline-offset-8 decoration-2',
	inactive: 'text-slate-400 hover:text-white',
} as const;

export const NAVIGATION_BUTTON_CLASSNAMES = {
	ghost: 'text-slate-300 hover:text-white px-3 py-2 xl:px-4 xl:py-2 rounded-md transition-colors duration-150',
	primary:
		'bg-slate-100 text-slate-900 hover:bg-white px-3 py-2 xl:px-4 xl:py-2 rounded-md font-medium transition-colors duration-150',
	logout: 'text-slate-400 hover:text-white px-3 py-2 xl:px-4 xl:py-2 rounded-md transition-colors duration-150',
} as const;

export const NAVIGATION_AUDIO_CONTAINER_CLASSNAME = 'flex items-center gap-2 text-slate-400';

export const NAVIGATION_BRAND_CLASSNAMES = {
	link: 'flex items-center gap-3 text-white hover:text-slate-200 transition-colors duration-150',
	logoWrapper: 'w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center',
	title: 'text-lg font-semibold tracking-tight',
	homeTitle: 'text-lg font-semibold tracking-tight',
	homeWrapper: 'flex items-center gap-3 text-slate-100',
} as const;
