import { useEffect, useRef } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';

import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import { mergeUserPreferences } from '@shared/utils';

import { AudioKey } from '@/constants';
import { ModalSize } from '@/constants/ui/size.constants';
import { useAppDispatch, useAudio } from '@/hooks';

import {
	CompleteProfile,
	Footer,
	ModalRouteWrapper,
	Navigation,
	NotFound,
	OAuthCallback,
	ProtectedRoute,
	PublicRoute,
} from './components';
import { fetchUserData, setAuthenticated, setUser } from './redux/slices';
import { audioService, authService, prefetchAuthenticatedQueries } from './services';
import {
	AdminDashboard,
	AnalyticsView,
	CustomDifficultyView,
	GameHistory,
	GameSessionView,
	GameSummaryView,
	HomeView,
	LeaderboardView,
	LoginView,
	MultiplayerGameView,
	MultiplayerLobbyView,
	MultiplayerResultsView,
	PaymentView,
	RegistrationView,
	UnauthorizedView,
	UserProfile,
} from './views';

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

		if (location.pathname === '/auth/google') {
			logger.navigationOAuth('Google', {
				path: location.pathname,
				timestamp: new Date().toISOString(),
			});
		}

		const routePatterns = [
			'/',
			'/game/play',
			'/game/summary',
			'/game/custom',
			'/play',
			'/start',
			'/profile',
			'/history',
			'/leaderboard',
			'/payment',
			'/credits',
			'/register',
			'/login',
			'/admin',
			'/auth/callback',
			'/complete-profile',
			'/analytics',
			'/multiplayer',
			'/multiplayer/game/:roomId',
			'/multiplayer/results/:roomId',
			'/forgot-password',
			'/unauthorized',
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

	// Check if current route is an authentication page
	const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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
						// Error already logged in auth.service.ts - no need to log again
						await authService.logout();
						// Clear Redux state after logout
						dispatch(setUser(null));
						dispatch(setAuthenticated(false));
						// Only redirect to login if not already on auth pages
						if (!isAuthPage) {
							window.location.href = '/login';
						}
					}
				} catch {
					// Error already logged in auth.service.ts - no need to log again
					await authService.logout();
					// Clear Redux state after logout
					dispatch(setUser(null));
					dispatch(setAuthenticated(false));
					// Only redirect to login if not already on auth pages
					if (!isAuthPage) {
						window.location.href = '/login';
					}
				}
			}
		};

		initAuth().catch(() => {
			// Silently handle any unhandled promise rejections from initAuth
			// These are expected when user is not authenticated
		});
	}, [dispatch, isAuthPage]);

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
					<Route path='/' element={<HomeView />} />
					<Route path='/play' element={<HomeView />} />
					<Route path='/start' element={<HomeView />} />
					<Route path='/leaderboard' element={<LeaderboardView />} />

					{/* Game routes */}
					<Route path='/game/play' element={<GameSessionView />} />
					<Route path='/game/summary' element={<GameSummaryView />} />
					<Route path='/game/custom' element={<CustomDifficultyView />} />

					{/* Multiplayer routes */}
					<Route
						path='/multiplayer'
						element={
							<ProtectedRoute>
								<MultiplayerLobbyView />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/multiplayer/game/:roomId'
						element={
							<ProtectedRoute>
								<MultiplayerGameView />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/multiplayer/results/:roomId'
						element={
							<ProtectedRoute>
								<MultiplayerResultsView />
							</ProtectedRoute>
						}
					/>

					{/* Protected routes - require authentication */}
					<Route
						path='/profile'
						element={
							<ProtectedRoute>
								<UserProfile />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/history'
						element={
							<ProtectedRoute>
								<GameHistory />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/payment'
						element={
							<ProtectedRoute>
								<ModalRouteWrapper modalSize={ModalSize.XL}>
									<PaymentView />
								</ModalRouteWrapper>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/complete-profile'
						element={
							<ProtectedRoute>
								<CompleteProfile />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/analytics'
						element={
							<ProtectedRoute>
								<AnalyticsView />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/admin'
						element={
							<ProtectedRoute requiredRole={UserRole.ADMIN}>
								<AdminDashboard />
							</ProtectedRoute>
						}
					/>

					{/* Public routes - redirect if authenticated */}
					<Route
						path='/login'
						element={
							<PublicRoute>
								<ModalRouteWrapper>
									<LoginView />
								</ModalRouteWrapper>
							</PublicRoute>
						}
					/>
					<Route
						path='/register'
						element={
							<PublicRoute>
								<ModalRouteWrapper>
									<RegistrationView />
								</ModalRouteWrapper>
							</PublicRoute>
						}
					/>

					{/* OAuth callback - no protection needed */}
					<Route path='/auth/callback' element={<OAuthCallback />} />

					{/* Forgot password - placeholder route */}
					<Route path='/forgot-password' element={<NotFound />} />

					{/* Unauthorized page */}
					<Route path='/unauthorized' element={<UnauthorizedView />} />

					{/* 404 */}
					<Route path='*' element={<NotFound />} />
				</Routes>
			</main>
			{!isAuthPage && <Footer />}
		</div>
	);
}
