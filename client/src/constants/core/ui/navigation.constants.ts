import type { NavigationLinks } from '@/types';
import { NavKey } from './localeKeys.constants';

export enum Routes {
	HOME = '/',
	STATISTICS = '/statistics',
	PRIVACY = '/privacy',
	TERMS = '/terms',
	CONTACT = '/contact',
	GAME = '/game',
	GAME_SINGLE = '/game/single',
	GAME_SINGLE_PLAY = '/game/single/play/:gameId',
	GAME_SINGLE_SUMMARY = '/game/single/summary/:gameId',
	MULTIPLAYER = '/game/multiplayer',
	MULTIPLAYER_PLAY = '/game/multiplayer/play/:roomId',
	MULTIPLAYER_SUMMARY = '/game/multiplayer/summary/:roomId',
	PAYMENT = '/payment',
	COMPLETE_PROFILE = '/complete-profile',
	ADMIN = '/admin',
	LOGIN = '/login',
	REGISTER = '/register',
	LEGAL_ACCEPTANCE = '/accept-legal',
	AUTH_CALLBACK = '/auth/callback',
	AUTH_GOOGLE = '/auth/google',
	UNAUTHORIZED = '/unauthorized',
}

const MAIN_NAV_LINKS = [
	{ labelKey: NavKey.START_GAME, path: Routes.GAME },
	{ labelKey: NavKey.STATISTICS, path: Routes.STATISTICS },
] as const;

const LEGAL_LINKS = [
	{ labelKey: NavKey.PRIVACY_POLICY, path: Routes.PRIVACY },
	{ labelKey: NavKey.TERMS_OF_SERVICE, path: Routes.TERMS },
	{ labelKey: NavKey.CONTACT, path: Routes.CONTACT },
] as const;

export const NAVIGATION_LINKS: NavigationLinks = {
	main: MAIN_NAV_LINKS,
	authenticated: [],
	admin: [{ labelKey: NavKey.ADMIN_DASHBOARD, path: Routes.ADMIN }],
	footer: {
		quick: MAIN_NAV_LINKS,
		legal: LEGAL_LINKS,
	},
};
