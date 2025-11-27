import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';

import { APP_NAME } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';

import { AudioKey, NAVIGATION_LINKS } from '../constants';
import { setAuthenticated, setUser } from '../redux/slices';
import { authService } from '../services';
import type { NavigationControllerResult, NavigationMenuLink, NavigationUserDisplay, RootState } from '../types';
import { formatScore } from '../utils';
import { useAudio } from './useAudio';
import { useCreditBalance } from './useCredits';
import { useAppDispatch } from './useRedux';

function buildNavigationLinks(currentPath: string): ReadonlyArray<NavigationMenuLink> {
	return NAVIGATION_LINKS.main.map(link => ({
		...link,
		isActive: currentPath === link.path,
	}));
}

function buildUserDisplay(params: {
	currentUser: RootState['user']['currentUser'];
	stateAvatar?: string | null;
}): NavigationUserDisplay | undefined {
	const { currentUser, stateAvatar } = params;

	if (!currentUser) {
		return undefined;
	}

	const displayEmail = currentUser.email || '';

	// Try to get firstName and lastName if they exist (if currentUser is UserProfile instead of BasicUser)
	const firstName =
		'firstName' in currentUser && typeof currentUser.firstName === 'string' ? currentUser.firstName : undefined;
	const lastName =
		'lastName' in currentUser && typeof currentUser.lastName === 'string' ? currentUser.lastName : undefined;

	return {
		email: displayEmail,
		avatar: stateAvatar || undefined,
		firstName: firstName ?? '',
		lastName: lastName ?? '',
	};
}

export function useNavigationController(): NavigationControllerResult {
	const audioService = useAudio();
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const queryClient = useQueryClient();

	const { currentUser, isAuthenticated, avatar: stateAvatar } = useSelector((state: RootState) => state.user);
	const { data: creditsData } = useCreditBalance();

	const isHomePage = location.pathname === '/';

	const navigationLinks = useMemo(() => buildNavigationLinks(location.pathname), [location.pathname]);

	const userDisplay = useMemo(
		() =>
			buildUserDisplay({
				currentUser,
				stateAvatar,
			}),
		[currentUser, stateAvatar]
	);

	const creditsDisplay = useMemo(() => {
		if (!creditsData?.balance) {
			return '0';
		}

		return formatScore(creditsData.balance);
	}, [creditsData]);

	const handleNavigateHome = useCallback(() => {
		if (!isHomePage) {
			audioService.play(AudioKey.PAGE_CHANGE);
			navigate('/');
		}
	}, [audioService, isHomePage, navigate]);

	const handleLogout = useCallback(async () => {
		audioService.play(AudioKey.PAGE_CHANGE);

		try {
			// Call logout service to clear tokens and API session
			await authService.logout();

			// Clear Redux state
			dispatch(setUser(null));
			dispatch(setAuthenticated(false));

			// Clear React Query cache
			queryClient.clear();

			// Navigate to home page
			navigate('/');
		} catch {
			// Even if logout fails, clear local state and navigate
			dispatch(setUser(null));
			dispatch(setAuthenticated(false));
			queryClient.clear();
			navigate('/');
		}
	}, [audioService, navigate, dispatch, queryClient]);

	const handleSignIn = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		logger.authInfo('Sign In button clicked - navigating to login page', {
			path: location.pathname,
		});
		navigate('/login');
	}, [audioService, navigate, location.pathname]);

	const handleSignUp = useCallback(() => {
		audioService.play(AudioKey.PAGE_CHANGE);
		navigate('/register');
	}, [audioService, navigate]);

	const handleGetMoreCredits = useCallback(() => {
		navigate('/payment');
	}, [navigate]);

	return {
		appName: APP_NAME,
		isHomePage,
		links: navigationLinks,
		isAuthenticated,
		userDisplay,
		credits: {
			display: creditsDisplay,
			total: creditsData?.totalCredits,
			freeQuestions: creditsData?.freeQuestions,
			nextResetTime: creditsData?.nextResetTime ?? null,
		},
		actions: {
			onNavigateHome: handleNavigateHome,
			onLogout: handleLogout,
			onSignUp: handleSignUp,
			onSignIn: handleSignIn,
			onGetMoreCredits: handleGetMoreCredits,
		},
	};
}
