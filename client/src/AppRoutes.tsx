import { useEffect, useRef } from 'react';
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';

import { UserRole } from '@shared/constants';
import { mergeUserPreferences } from '@shared/utils';

import { AudioKey, ModalSize, ROUTES } from '@/constants';

import {
	CompleteProfile,
	Footer,
	ModalRouteWrapper,
	Navigation,
	NotFound,
	OAuthCallback,
	ProtectedRoute,
	PublicRoute,
} from '@/components';

import { useAppDispatch, useAudio } from '@/hooks';

import { audioService, authService, clientLogger as logger, prefetchAuthenticatedQueries } from '@/services';

import { fetchUserData, setAuthenticated, setUser } from '@/redux/slices';

import {
	AdminDashboard,
	ContactView,
	CustomDifficultyView,
	GameSessionView,
	GameSummaryView,
	HomeView,
	LoginView,
	MultiplayerGameView,
	MultiplayerLobbyView,
	MultiplayerResultsView,
	PaymentView,
	PrivacyPolicyView,
	RegistrationView,
	StatisticsView,
	TermsOfServiceView,
	UnauthorizedView,
	UserProfile,
} from '@/views';

/**
 * Navigation tracking component for analytics and error logging
 *
 * @component NavigationTracker
 * @description Tracks page navigation, OAuth flows, and unknown routes for analytics
 * @returns null Renders nothing, only handles side effects
 */
function NavigationTracker() {
	const location = useLocation();
	const audioService = useAudio();
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
			ROUTES.GAME_CUSTOM,
			ROUTES.PLAY,
			ROUTES.START,
			ROUTES.PROFILE,
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

	return null;
}

/**
 * Main routing component for the application
 *
 * @component AppRoutes
 * @description Handles all application routing, authentication initialization, and navigation tracking
 * @returns JSX.Element The rendered application with routing and navigation
 */
export default function AppRoutes() {
	const dispatch = useAppDispatch();
	const location = useLocation();
	const queryClient = useQueryClient();

	// Check if current route is an authentication page
	const isAuthPage = location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

	useEffect(() => {
		const initAuth = async () => {
			if (await authService.isAuthenticated()) {
				try {
					// Use the async thunk instead of manual API call
					const result = await dispatch(fetchUserData());
					if (fetchUserData.fulfilled.match(result)) {
						const user = result.payload;
						dispatch(setUser(user));
						dispatch(setAuthenticated(true));

						// Set user preferences for audio service (if available)
						if ('preferences' in user && user.preferences) {
							const mergedPreferences = mergeUserPreferences(null, user.preferences);
							audioService.setUserPreferences(mergedPreferences);
						}

						// Prefetch authenticated-only data
						// Error already logged in queryClient.service.ts - no need to log again
						await prefetchAuthenticatedQueries();
					} else if (fetchUserData.rejected.match(result)) {
						// authService.logout() clears all auth data, localStorage, and Redux Persist
						await authService.logout();
						// Clear React Query cache to remove all user-specific cached data
						queryClient.clear();
						// Clear Redux state after logout
						dispatch(setUser(null));
						dispatch(setAuthenticated(false));
						// Only redirect to login if not already on auth pages
						if (!isAuthPage) {
							window.location.href = ROUTES.LOGIN;
						}
					}
				} catch {
					// authService.logout() clears all auth data, localStorage, and Redux Persist
					await authService.logout();
					// Clear React Query cache to remove all user-specific cached data
					queryClient.clear();
					// Clear Redux state after logout
					dispatch(setUser(null));
					dispatch(setAuthenticated(false));
					// Only redirect to login if not already on auth pages
					if (!isAuthPage) {
						window.location.href = ROUTES.LOGIN;
					}
				}
			}
		};

		initAuth().catch(() => {
			// Silently handle any unhandled promise rejections from initAuth
			// These are expected when user is not authenticated
		});
	}, [dispatch, isAuthPage, queryClient]);

	return (
		<div className='app-shell'>
			<NavigationTracker />
			<a
				href='#main-content'
				className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:block'
			>
				Skip to main content
			</a>
			{!isAuthPage && <Navigation />}
			<main id='main-content' className='app-main' tabIndex={-1}>
				<Routes>
					{/* Public routes */}
					<Route path={ROUTES.HOME} element={<HomeView />} />
					<Route path={ROUTES.PLAY} element={<HomeView />} />
					<Route path={ROUTES.START} element={<HomeView />} />
					<Route path={ROUTES.STATISTICS} element={<StatisticsView />} />

					{/* Legal and Info routes */}
					<Route path={ROUTES.PRIVACY} element={<PrivacyPolicyView />} />
					<Route path={ROUTES.TERMS} element={<TermsOfServiceView />} />
					<Route path={ROUTES.CONTACT} element={<ContactView />} />

					{/* Game routes */}
					<Route path={ROUTES.GAME} element={<Navigate to={ROUTES.GAME_PLAY} replace />} />
					<Route path={ROUTES.GAME_PLAY} element={<GameSessionView />} />
					<Route path={ROUTES.GAME_SUMMARY} element={<GameSummaryView />} />
					<Route path={ROUTES.GAME_CUSTOM} element={<CustomDifficultyView />} />

					{/* Multiplayer routes */}
					<Route
						path={ROUTES.MULTIPLAYER}
						element={
							<ProtectedRoute>
								<MultiplayerLobbyView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.MULTIPLAYER_GAME}
						element={
							<ProtectedRoute>
								<MultiplayerGameView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.MULTIPLAYER_RESULTS}
						element={
							<ProtectedRoute>
								<MultiplayerResultsView />
							</ProtectedRoute>
						}
					/>

					{/* Protected routes - require authentication */}
					<Route
						path={ROUTES.PROFILE}
						element={
							<ProtectedRoute>
								<UserProfile />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.PAYMENT}
						element={
							<ProtectedRoute>
								<ModalRouteWrapper modalSize={ModalSize.XL}>
									<PaymentView />
								</ModalRouteWrapper>
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.COMPLETE_PROFILE}
						element={
							<ProtectedRoute>
								<CompleteProfile />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.ADMIN}
						element={
							<ProtectedRoute requiredRole={UserRole.ADMIN}>
								<AdminDashboard />
							</ProtectedRoute>
						}
					/>

					{/* Public routes - redirect if authenticated */}
					<Route
						path={ROUTES.LOGIN}
						element={
							<PublicRoute>
								<ModalRouteWrapper>
									<LoginView />
								</ModalRouteWrapper>
							</PublicRoute>
						}
					/>
					<Route
						path={ROUTES.REGISTER}
						element={
							<PublicRoute>
								<ModalRouteWrapper>
									<RegistrationView />
								</ModalRouteWrapper>
							</PublicRoute>
						}
					/>

					{/* OAuth callback - no protection needed */}
					<Route path={ROUTES.AUTH_CALLBACK} element={<OAuthCallback />} />

					{/* Forgot password - placeholder route */}
					<Route path={ROUTES.FORGOT_PASSWORD} element={<NotFound />} />

					{/* Unauthorized page */}
					<Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedView />} />

					{/* 404 */}
					<Route path='*' element={<NotFound />} />
				</Routes>
			</main>
			{!isAuthPage && <Footer />}
		</div>
	);
}
