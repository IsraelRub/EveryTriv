import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { APP_NAME } from '@shared/constants';

import { useAudio } from './useAudio';
import { AudioKey, NAVIGATION_LINKS, ROUTE_PATHS } from '../constants';
import { usePointBalance } from './usePoints';
import { formatScore, formatUsername } from '../utils';
import type {
	NavigationControllerResult,
	NavigationMenuLink,
	NavigationUserDisplay,
	RootState,
} from '../types';

function buildNavigationLinks(currentPath: string): ReadonlyArray<NavigationMenuLink> {
	return NAVIGATION_LINKS.main.map(link => ({
		...link,
		isActive: currentPath === link.path,
	}));
}

function buildUserDisplay(params: {
	currentUser: RootState['user']['currentUser'];
	stateUsername?: string | null;
	stateAvatar?: string | null;
}): NavigationUserDisplay | undefined {
	const { currentUser, stateUsername, stateAvatar } = params;

	if (!currentUser) {
		return undefined;
	}

	const displayUsername = stateUsername || currentUser.username || '';

	return {
		username: formatUsername(displayUsername),
		fullName: displayUsername,
		avatar: stateAvatar || undefined,
		firstName: '',
		lastName: '',
	};
}

export function useNavigationController(): NavigationControllerResult {
	const audioService = useAudio();
	const location = useLocation();
	const navigate = useNavigate();

	const { currentUser, isAuthenticated, username: stateUsername, avatar: stateAvatar } = useSelector(
		(state: RootState) => state.user
	);
	const { data: pointsData } = usePointBalance();

	const isHomePage = location.pathname === ROUTE_PATHS.HOME;

	const navigationLinks = useMemo(
		() => buildNavigationLinks(location.pathname),
		[location.pathname]
	);

	const userDisplay = useMemo(
		() =>
			buildUserDisplay({
				currentUser,
				stateUsername,
				stateAvatar,
			}),
		[currentUser, stateUsername, stateAvatar]
	);

	const pointsDisplay = useMemo(() => {
		if (!pointsData?.balance) {
			return '0';
		}

		return formatScore(pointsData.balance);
	}, [pointsData]);

	const handleNavigateHome = useCallback(() => {
		if (!isHomePage) {
			audioService.play(AudioKey.PAGE_CHANGE);
			navigate(ROUTE_PATHS.HOME);
		}
	}, [audioService, isHomePage, navigate]);

	const handleLogout = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		navigate(ROUTE_PATHS.HOME);
	}, [audioService, navigate]);

	const handleGoogleLogin = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
	}, [audioService]);

	const handleSignUp = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		navigate(ROUTE_PATHS.REGISTER);
	}, [audioService, navigate]);

	const handleGetMorePoints = useCallback(() => {
		navigate(ROUTE_PATHS.PAYMENT);
	}, [navigate]);

	return {
		appName: APP_NAME,
		isHomePage,
		links: navigationLinks,
		isAuthenticated,
		userDisplay,
		points: {
			display: pointsDisplay,
			total: pointsData?.totalPoints,
			freeQuestions: pointsData?.freeQuestions,
			nextResetTime: pointsData?.nextResetTime ?? null,
		},
		actions: {
			onNavigateHome: handleNavigateHome,
			onLogout: handleLogout,
			onSignUp: handleSignUp,
			onGoogleLogin: handleGoogleLogin,
			onGetMorePoints: handleGetMorePoints,
		},
	};
}


