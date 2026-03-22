import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import {
	DEFAULT_GAME_CONFIG,
	GAME_MODES_CONFIG,
	GameMode,
	Locale,
	UserRole,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { GameConfig } from '@shared/types';
import { isNonEmptyString, isRecord, mergeUserPreferences } from '@shared/utils';
import { isGameMode, isLocale, isRegisteredDifficulty, toDifficultyLevel, VALIDATORS } from '@shared/validation';

import { ComponentSize, ROUTES } from '@/constants';
import { isProtectedAppPath } from '@/utils';
import { audioService, authService, prefetchAuthenticatedQueries, queryClient } from '@/services';
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
	Toaster,
} from '@/components';
import { useCurrentUser, useNavigationAnalytics, useRouteBasedMusic, useUserProfile } from '@/hooks';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectLocale } from '@/redux/selectors';
import { setGameMode } from '@/redux/slices';
import { setLocale } from '@/redux/slices/uiPreferencesSlice';
import {
	AdminDashboard,
	ContactView,
	GameSetupView,
	HomeView,
	LoginView,
	MultiplayerGameView,
	MultiplayerLobbyView,
	MultiplayerResultsView,
	PaymentView,
	PrivacyPolicyView,
	RegistrationView,
	SingleSessionView,
	SingleSummaryView,
	StatisticsView,
	TermsOfServiceView,
	UnauthorizedView,
} from '@/views';

export default function AppRoutes() {
	const location = useLocation();
	const dispatch = useAppDispatch();
	const locale = useAppSelector(selectLocale);
	const { data: currentUser, isError, isLoading: isUserLoading } = useCurrentUser();
	const { data: profileData } = useUserProfile();

	// Track navigation analytics
	useNavigationAnalytics();

	// Manage music based on route (game routes = game music, others = background music)
	useRouteBasedMusic();

	// Sync profile preferences (locale, game) from server to Redux when loaded
	useEffect(() => {
		const preferences = profileData?.preferences;
		if (!isRecord(preferences)) return;

		if (isLocale(preferences.locale)) {
			dispatch(setLocale(preferences.locale));
		}

		const game = preferences.game;
		if (isRecord(game) && Object.keys(game).length > 0) {
			const mode = isGameMode(game.defaultGameMode) ? game.defaultGameMode : GameMode.QUESTION_LIMITED;
			const defaults = GAME_MODES_CONFIG[mode]?.defaults ?? GAME_MODES_CONFIG[GameMode.QUESTION_LIMITED].defaults;
			const config: GameConfig = {
				mode,
				topic: isNonEmptyString(game.defaultTopic) ? game.defaultTopic : DEFAULT_GAME_CONFIG.defaultTopic,
				difficulty:
					typeof game.defaultDifficulty === 'string' && isRegisteredDifficulty(game.defaultDifficulty)
						? toDifficultyLevel(game.defaultDifficulty)
						: DEFAULT_GAME_CONFIG.defaultDifficulty,
				timeLimit: VALIDATORS.number(game.timeLimit) ? game.timeLimit : defaults.timeLimit,
				maxQuestionsPerGame: VALIDATORS.number(game.maxQuestionsPerGame)
					? game.maxQuestionsPerGame
					: (defaults.maxQuestionsPerGame ?? DEFAULT_GAME_CONFIG.maxQuestionsPerGame),
				answerCount: VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
			};
			dispatch(setGameMode(config));
		}
	}, [profileData?.preferences, dispatch]);

	// Check if current route is an authentication page
	const isAuthPage = location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;
	// Redirect to login on auth failure only when on a protected route (so closing login modal doesn't send user back to login)
	const isProtectedPath = isProtectedAppPath(location.pathname);

	// Session restore and /me run in AppAuthBootstrap; here we sync audio, prefetch after login, and handle token expiry during the session.
	useEffect(() => {
		if (currentUser) {
			if ('preferences' in currentUser && currentUser.preferences) {
				const mergedPreferences = mergeUserPreferences(null, currentUser.preferences);
				audioService.setUserPreferences(mergedPreferences);
			}

			const handlePrefetchQueries = async () => {
				try {
					await prefetchAuthenticatedQueries();
				} catch {
					// Silently handle prefetch errors
				}
			};
			void handlePrefetchQueries();
			return;
		}

		if (!isUserLoading && isError) {
			const handleAuthFailure = async () => {
				await authService.logout();
				queryClient.clear();
				if (!isAuthPage && isProtectedPath) {
					window.location.href = ROUTES.HOME;
				}
			};
			void handleAuthFailure();
		}
	}, [currentUser, isError, isUserLoading, isAuthPage, isProtectedPath]);

	return (
		<div className='app-shell'>
			<BackgroundAnimation />
			{!isAuthPage && <Navigation />}
			<main id='main-content' className='app-main' dir={locale === Locale.HE ? 'rtl' : 'ltr'}>
				<Routes>
					{/* Public routes */}
					<Route path={ROUTES.HOME} element={<HomeView />} />
					<Route path={ROUTES.STATISTICS} element={<StatisticsView />} />

					{/* Legal and Info routes */}
					<Route path={ROUTES.PRIVACY} element={<PrivacyPolicyView />} />
					<Route path={ROUTES.TERMS} element={<TermsOfServiceView />} />
					<Route path={ROUTES.CONTACT} element={<ContactView />} />

					{/* Game routes - single player and multiplayer both require auth (credits, stats) */}
					<Route
						path={ROUTES.GAME}
						element={
							<ProtectedRoute>
								<GameSetupView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.GAME_SINGLE}
						element={
							<ProtectedRoute>
								<GameSetupView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.GAME_SINGLE_PLAY}
						element={
							<ProtectedRoute>
								<SingleSessionView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.GAME_SINGLE_SUMMARY}
						element={
							<ProtectedRoute>
								<SingleSummaryView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.MULTIPLAYER}
						element={
							<ProtectedRoute>
								<MultiplayerLobbyView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.MULTIPLAYER_PLAY}
						element={
							<ProtectedRoute>
								<MultiplayerGameView />
							</ProtectedRoute>
						}
					/>
					<Route
						path={ROUTES.MULTIPLAYER_SUMMARY}
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
								<ModalRouteWrapper modalSize={ComponentSize.XL}>
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
