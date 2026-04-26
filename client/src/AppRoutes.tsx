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
import { buildGameDifficultyFromUserGamePreferences, isNonEmptyString, isRecord } from '@shared/utils';
import { isGameMode, isLocale, isRegisteredDifficulty, toDifficultyLevel, VALIDATORS } from '@shared/validation';

import { ComponentSize, Routes as RoutePaths } from '@/constants';
import { authService, prefetchAuthenticatedQueries, queryClient } from '@/services';
import { isProtectedAppPath } from '@/utils';
import {
	BackgroundAnimation,
	CompleteProfile,
	Footer,
	LegalConsentRedirect,
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
	LegalAcceptanceView,
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
			const onActiveGameplayRoute =
				location.pathname.startsWith(`${RoutePaths.GAME_SINGLE}/play/`) ||
				location.pathname.startsWith(`${RoutePaths.GAME_SINGLE}/summary/`) ||
				location.pathname.startsWith(`${RoutePaths.MULTIPLAYER}/play/`) ||
				location.pathname.startsWith(`${RoutePaths.MULTIPLAYER}/summary/`);

			if (!onActiveGameplayRoute) {
				const mode = isGameMode(game.defaultGameMode) ? game.defaultGameMode : GameMode.QUESTION_LIMITED;
				const defaults = GAME_MODES_CONFIG[mode]?.defaults ?? GAME_MODES_CONFIG[GameMode.QUESTION_LIMITED].defaults;
				const config: GameConfig = {
					mode,
					topic: isNonEmptyString(game.defaultTopic) ? game.defaultTopic : DEFAULT_GAME_CONFIG.defaultTopic,
					difficulty:
						VALIDATORS.string(game.defaultDifficulty) && isRegisteredDifficulty(game.defaultDifficulty)
							? buildGameDifficultyFromUserGamePreferences({
									defaultDifficulty: toDifficultyLevel(game.defaultDifficulty),
									defaultCustomDifficultyDescription: VALIDATORS.string(game.defaultCustomDifficultyDescription)
										? game.defaultCustomDifficultyDescription
										: undefined,
								})
							: DEFAULT_GAME_CONFIG.defaultDifficulty,
					timeLimit: VALIDATORS.number(game.timeLimit) ? game.timeLimit : defaults.timeLimit,
					maxQuestionsPerGame: VALIDATORS.number(game.maxQuestionsPerGame)
						? game.maxQuestionsPerGame
						: (defaults.maxQuestionsPerGame ?? DEFAULT_GAME_CONFIG.maxQuestionsPerGame),
					answerCount: VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
				};
				dispatch(setGameMode(config));
			}
		}
	}, [profileData?.preferences, dispatch, location.pathname]);

	// Check if current route is an authentication page
	const isAuthPage =
		location.pathname === RoutePaths.LOGIN ||
		location.pathname === RoutePaths.REGISTER ||
		location.pathname === RoutePaths.LEGAL_ACCEPTANCE;
	// Redirect to login on auth failure only when on a protected route (so closing login modal doesn't send user back to login)
	const isProtectedPath = isProtectedAppPath(location.pathname);

	// Session restore and /me run in AppAuthBootstrap; here we prefetch after login becomes available and handle token expiry during the session.
	useEffect(() => {
		if (currentUser) {
			void prefetchAuthenticatedQueries();
			return;
		}

		if (!isUserLoading && isError) {
			const handleAuthFailure = async () => {
				await authService.logout();
				queryClient.clear();
				if (!isAuthPage && isProtectedPath) {
					window.location.href = RoutePaths.HOME;
				}
			};
			void handleAuthFailure();
		}
	}, [currentUser, isError, isUserLoading, isAuthPage, isProtectedPath]);

	return (
		<div className='app-shell'>
			<BackgroundAnimation />
			<Navigation />
			<main id='main-content' className='app-main' dir={locale === Locale.HE ? 'rtl' : 'ltr'}>
				<div key={location.pathname} className='flex min-h-0 w-full flex-1 flex-col animate-route-shell-enter'>
					<LegalConsentRedirect />
					<Routes>
						{/* Public routes */}
						<Route path={RoutePaths.HOME} element={<HomeView />} />
						<Route path={RoutePaths.STATISTICS} element={<StatisticsView />} />

						{/* Legal and Info routes */}
						<Route path={RoutePaths.PRIVACY} element={<PrivacyPolicyView />} />
						<Route path={RoutePaths.TERMS} element={<TermsOfServiceView />} />
						<Route path={RoutePaths.CONTACT} element={<ContactView />} />

						{/* Game routes - single player and multiplayer both require auth (credits, stats) */}
						<Route
							path={RoutePaths.GAME}
							element={
								<ProtectedRoute>
									<GameSetupView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.GAME_SINGLE}
							element={
								<ProtectedRoute>
									<GameSetupView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.GAME_SINGLE_PLAY}
							element={
								<ProtectedRoute>
									<SingleSessionView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.GAME_SINGLE_SUMMARY}
							element={
								<ProtectedRoute>
									<SingleSummaryView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.MULTIPLAYER}
							element={
								<ProtectedRoute>
									<MultiplayerLobbyView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.MULTIPLAYER_PLAY}
							element={
								<ProtectedRoute>
									<MultiplayerGameView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.MULTIPLAYER_SUMMARY}
							element={
								<ProtectedRoute>
									<MultiplayerResultsView />
								</ProtectedRoute>
							}
						/>

						{/* Protected routes - require authentication */}
						<Route
							path={RoutePaths.PAYMENT}
							element={
								<ProtectedRoute>
									<ModalRouteWrapper modalSize={ComponentSize.XL}>
										<PaymentView />
									</ModalRouteWrapper>
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.COMPLETE_PROFILE}
							element={
								<ProtectedRoute>
									<CompleteProfile />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.LEGAL_ACCEPTANCE}
							element={
								<ProtectedRoute>
									<LegalAcceptanceView />
								</ProtectedRoute>
							}
						/>
						<Route
							path={RoutePaths.ADMIN}
							element={
								<ProtectedRoute requiredRole={UserRole.ADMIN}>
									<AdminDashboard />
								</ProtectedRoute>
							}
						/>

						{/* Public routes - redirect if authenticated */}
						<Route
							path={RoutePaths.LOGIN}
							element={
								<PublicRoute>
									<ModalRouteWrapper>
										<LoginView />
									</ModalRouteWrapper>
								</PublicRoute>
							}
						/>
						<Route
							path={RoutePaths.REGISTER}
							element={
								<PublicRoute>
									<ModalRouteWrapper>
										<RegistrationView />
									</ModalRouteWrapper>
								</PublicRoute>
							}
						/>

						{/* OAuth callback - no protection needed */}
						<Route path={RoutePaths.AUTH_CALLBACK} element={<OAuthCallback />} />

						{/* Unauthorized page */}
						<Route path={RoutePaths.UNAUTHORIZED} element={<UnauthorizedView />} />

						{/* 404 */}
						<Route path='*' element={<NotFound />} />
					</Routes>
				</div>
			</main>
			<Footer />
			<Toaster />
		</div>
	);
}
