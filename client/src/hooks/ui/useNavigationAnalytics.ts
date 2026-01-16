import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { AudioKey, ROUTES } from '@/constants';
import { audioService, clientLogger as logger } from '@/services';

export function useNavigationAnalytics() {
	const location = useLocation();
	const prevPathnameRef = useRef<string | null>(null);

	useEffect(() => {
		if (prevPathnameRef.current !== null && prevPathnameRef.current !== location.pathname) {
			audioService.play(AudioKey.PAGE_CHANGE);
		}
		prevPathnameRef.current = location.pathname;

		logger.navigationPage(location.pathname, {
			search: location.search,
			timestamp: new Date().toISOString(),
			type: 'spa_navigation',
		});

		if (location.pathname === ROUTES.AUTH_GOOGLE) {
			logger.navigationOAuth('Google', {
				path: location.pathname,
				timestamp: new Date().toISOString(),
			});
		}

		const routePatterns = [
			ROUTES.HOME,
			ROUTES.GAME,
			ROUTES.GAME_PLAY,
			ROUTES.GAME_SUMMARY,
			ROUTES.PLAY,
			ROUTES.START,
			ROUTES.PAYMENT,
			'/credits',
			ROUTES.REGISTER,
			ROUTES.LOGIN,
			ROUTES.ADMIN,
			ROUTES.AUTH_CALLBACK,
			ROUTES.COMPLETE_PROFILE,
			ROUTES.STATISTICS,
			ROUTES.LEADERBOARD,
			ROUTES.MULTIPLAYER,
			ROUTES.MULTIPLAYER_GAME,
			ROUTES.MULTIPLAYER_RESULTS,
			ROUTES.PRIVACY,
			ROUTES.TERMS,
			ROUTES.CONTACT,
			ROUTES.FORGOT_PASSWORD,
			ROUTES.UNAUTHORIZED,
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
