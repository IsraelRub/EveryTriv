import { useEffect } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';

import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage, mergeUserPreferences } from '@shared/utils';

import {
	CompleteProfile,
	Footer,
	Navigation,
	NotFound,
	OAuthCallback,
	ProtectedRoute,
	PublicRoute,
} from './components';
import { useAppDispatch } from './hooks';
import { fetchUserData, setAuthenticated, setUser } from './redux/slices';
import { audioService, authService, prefetchAuthenticatedQueries } from './services';
import AdminDashboard from './views/admin/AdminDashboard';
import { AnalyticsView } from './views/analytics/AnalyticsView';
import CustomDifficultyView from './views/game/CustomDifficultyView';
import GameSessionView from './views/game/GameSessionView';
import GameSummaryView from './views/game/GameSummaryView';
import GameHistory from './views/gameHistory/GameHistory';
import HomeView from './views/home/HomeView';
import { LeaderboardView } from './views/leaderboard';
import LoginView from './views/login/LoginView';
import MultiplayerGameView from './views/multiplayer/MultiplayerGameView';
import MultiplayerLobbyView from './views/multiplayer/MultiplayerLobbyView';
import MultiplayerResultsView from './views/multiplayer/MultiplayerResultsView';
import PaymentView from './views/payment';
import { RegistrationView } from './views/registration';
import SettingsView from './views/settings/SettingsView';
import UnauthorizedView from './views/unauthorized/UnauthorizedView';
import UserProfile from './views/user';

/**
 * Navigation tracking component for analytics and error logging
 *
 * @component NavigationTracker
 * @description Tracks page navigation, OAuth flows, and unknown routes for analytics
 * @returns null Renders nothing, only handles side effects
 */
function NavigationTracker() {
	const location = useLocation();

	useEffect(() => {
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
			'/game',
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
			'/settings',
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
						try {
							await prefetchAuthenticatedQueries();
						} catch (error) {
							logger.apiError('Failed to prefetch authenticated queries', { error: getErrorMessage(error) });
						}
					}
				} catch (error) {
					logger.authError('Authentication initialization failed', {
						error: getErrorMessage(error),
					});
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

		initAuth();
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
					<Route path='/game' element={<HomeView />} />
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
								<PaymentView />
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
						path='/settings'
						element={
							<ProtectedRoute>
								<SettingsView />
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
								<LoginView />
							</PublicRoute>
						}
					/>
					<Route
						path='/register'
						element={
							<PublicRoute>
								<RegistrationView />
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
