import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { UserRole } from '@shared/constants';
import { mergeUserPreferences } from '@shared/utils';

import { ModalSize, ROUTES, SpinnerSize } from '@/constants';
import {
	BackgroundAnimation,
	CompleteProfile,
	Footer,
	ModalRouteWrapper,
	Navigation,
	NotFound,
	OAuthCallback,
	ProtectedRoute,
	PublicRoute,
	Spinner,
	Toaster,
} from '@/components';
import { useCurrentUser, useNavigationAnalytics } from '@/hooks';
import { audioService, authService, prefetchAuthenticatedQueries, queryClient } from '@/services';
import {
	AdminDashboard,
	ContactView,
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
} from '@/views';

export default function AppRoutes() {
	const location = useLocation();
	const initAuthRanRef = useRef(false);
	const { data: currentUser, isError, isLoading: isUserLoading } = useCurrentUser();
	const [isInitializingAuth, setIsInitializingAuth] = useState(true);

	// Track navigation analytics
	useNavigationAnalytics();

	// Check if current route is an authentication page
	const isAuthPage = location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

	useEffect(() => {
		// Prevent multiple runs of initAuth
		if (initAuthRanRef.current) {
			return;
		}

		initAuthRanRef.current = true;

		const initAuth = async () => {
			setIsInitializingAuth(true);
			try {
				const isAuthenticated = await authService.isAuthenticated();
				if (!isAuthenticated) {
					setIsInitializingAuth(false);
					return;
				}

				// Wait for user query to complete (either success or error)
				// The useCurrentUser hook will handle the query automatically
				// We just need to wait for it to finish loading
			} catch {
				// If authentication check fails, treat as not authenticated
				setIsInitializingAuth(false);
			}
		};

		initAuth().catch(() => {
			// Silently handle any unhandled promise rejections from initAuth
			// These are expected when user is not authenticated
			setIsInitializingAuth(false);
		});
	}, [isAuthPage]);

	// Handle user data when it's loaded
	useEffect(() => {
		if (!isUserLoading && initAuthRanRef.current) {
			if (currentUser) {
				// Set user preferences for audio service (if available)
				if ('preferences' in currentUser && currentUser.preferences) {
					const mergedPreferences = mergeUserPreferences(null, currentUser.preferences);
					audioService.setUserPreferences(mergedPreferences);
				}

				// Prefetch authenticated-only data
				prefetchAuthenticatedQueries().catch(() => {
					// Silently handle prefetch errors
				});

				setIsInitializingAuth(false);
			} else if (isError) {
				// User query failed - handle auth failure
				const handleAuthFailure = async () => {
					await authService.logout();
					queryClient.clear();
					if (!isAuthPage) {
						window.location.href = ROUTES.LOGIN;
					}
				};
				handleAuthFailure().finally(() => {
					setIsInitializingAuth(false);
				});
			} else if (!isUserLoading) {
				// Query completed but no user data - not authenticated
				setIsInitializingAuth(false);
			}
		}
	}, [currentUser, isError, isUserLoading, isAuthPage]);

	// Show loading indicator during auth initialization
	if (isInitializingAuth) {
		return (
			<div className='app-shell'>
				<BackgroundAnimation />
				<main id='main-content' className='app-main flex items-center justify-center min-h-screen'>
					<Spinner size={SpinnerSize.LG} variant='loader' />
				</main>
			</div>
		);
	}

	return (
		<div className='app-shell'>
			<BackgroundAnimation />
			{!isAuthPage && <Navigation />}
			<main id='main-content' className='app-main'>
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
			<Toaster />
		</div>
	);
}
