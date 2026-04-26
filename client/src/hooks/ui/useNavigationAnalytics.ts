import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { AudioKey, Routes } from '@/constants';
import { audioService, clientLogger as logger } from '@/services';

export function useNavigationAnalytics() {
	const location = useLocation();
	const prevPathnameRef = useRef<string | null>(null);

	useEffect(() => {
		if (prevPathnameRef.current != null && prevPathnameRef.current !== location.pathname) {
			audioService.play(AudioKey.PAGE_CHANGE);
		}
		prevPathnameRef.current = location.pathname;

		logger.navigationPage(location.pathname, {
			search: location.search,
			timestamp: new Date().toISOString(),
			type: 'spa_navigation',
		});

		if (location.pathname === Routes.AUTH_GOOGLE) {
			logger.navigationOAuth('Google', {
				path: location.pathname,
				timestamp: new Date().toISOString(),
			});
		}

		const routePatterns = [
			Routes.HOME,
			Routes.GAME,
			Routes.GAME_SINGLE,
			Routes.GAME_SINGLE_PLAY,
			Routes.GAME_SINGLE_SUMMARY,
			Routes.PAYMENT,
			Routes.REGISTER,
			Routes.LOGIN,
			Routes.ADMIN,
			Routes.AUTH_CALLBACK,
			Routes.COMPLETE_PROFILE,
			Routes.STATISTICS,
			Routes.MULTIPLAYER,
			Routes.MULTIPLAYER_PLAY,
			Routes.MULTIPLAYER_SUMMARY,
			Routes.PRIVACY,
			Routes.TERMS,
			Routes.CONTACT,
			Routes.UNAUTHORIZED,
		];

		const isValidRoute = routePatterns.some(pattern => matchPath({ path: pattern, end: true }, location.pathname));
		const isAuthRoute = location.pathname.startsWith('/auth/');

		if (!isValidRoute && !isAuthRoute) {
			logger.navigationUnknownRoute(location.pathname, {
				referrer: document.referrer,
				timestamp: new Date().toISOString(),
				type: 'unknown_route',
			});
		}
	}, [location]);
}
