import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Footer, NotFound } from './components/layout';
import { Navigation } from './components/navigation';
import { CompleteProfile, OAuthCallback } from './components/user';
import { setAuthenticated, setUser } from './redux/features/userSlice';
import { authService } from './services/auth';
import { logger } from './services/utils';
import { GameHistory } from './views/gameHistory';
import HomeView from './views/home';
import { Leaderboard } from './views/leaderboard';
import PaymentView from './views/payment';
import { RegistrationView } from './views/registration';
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

		const validRoutes = ['/', '/game', '/play', '/start', '/profile', '/history', '/leaderboard', '/payment', '/register', '/auth/callback', '/complete-profile'];
		if (!validRoutes.includes(location.pathname) && !location.pathname.startsWith('/auth/')) {
			
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
	const dispatch = useDispatch();

	useEffect(() => {
		const initAuth = async () => {
			if (authService.isAuthenticated()) {
				try {
					const user = await authService.getCurrentUser();
					dispatch(setUser(user));
					dispatch(setAuthenticated(true));
				} catch (error) {
					authService.logout();
				}
			}
		};

		initAuth();
	}, [dispatch]);

	return (
		<div className='flex flex-col min-h-screen'>
			<NavigationTracker />
			<Navigation />
			<main className='flex-grow'>
				<Routes>
					<Route path='/' element={<HomeView />} />
					<Route path='/game' element={<HomeView />} />
					<Route path='/play' element={<HomeView />} />
					<Route path='/start' element={<HomeView />} />
					<Route path='/profile' element={<UserProfile />} />
					<Route path='/history' element={<GameHistory />} />
					<Route path='/leaderboard' element={<Leaderboard />} />
					<Route path='/payment' element={<PaymentView />} />
					<Route path='/register' element={<RegistrationView />} />
					<Route path='/auth/callback' element={<OAuthCallback />} />
					<Route path='/complete-profile' element={<CompleteProfile />} />
					<Route path='*' element={<NotFound />} />
				</Routes>
			</main>
			<Footer />
		</div>
	);
}
