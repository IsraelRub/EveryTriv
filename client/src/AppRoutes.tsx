import { clientLogger, mergeWithDefaults } from '@shared';
import type { UserRole } from '@shared/types/domain/user/user.types';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { ProtectedRoute, PublicRoute } from './components/auth';
import { Footer, NotFound } from './components/layout';
import { Navigation } from './components/navigation';
import { CompleteProfile, OAuthCallback } from './components/user';
import { USER_DEFAULT_VALUES } from './constants';
import { useAppDispatch } from './hooks/layers/utils';
import { fetchUserData,setAuthenticated, setUser } from './redux/slices/userSlice';
import { audioService } from './services';
import { authService } from './services/auth';
import { GameHistory } from './views/gameHistory';
import HomeView from './views/home';
import { LeaderboardView } from './views/leaderboard';
import PaymentView from './views/payment';
import { RegistrationView } from './views/registration';
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
    clientLogger.navigationPage(location.pathname, {
      search: location.search,
      timestamp: new Date().toISOString(),
      type: 'spa_navigation',
    });

    if (location.pathname === '/auth/google') {
      clientLogger.navigationOAuth('Google', {
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    }

    const validRoutes = [
      '/',
      '/game',
      '/play',
      '/start',
      '/profile',
      '/history',
      '/leaderboard',
      '/payment',
      '/register',
      '/auth/callback',
      '/complete-profile',
      '/analytics',
    ];
    if (!validRoutes.includes(location.pathname) && !location.pathname.startsWith('/auth/')) {
      clientLogger.navigationUnknownRoute(location.pathname, {
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

  useEffect(() => {
    const initAuth = async () => {
      if (await authService.isAuthenticated()) {
        try {
          // Use the async thunk instead of manual API call
          const result = await dispatch(fetchUserData());
          if (fetchUserData.fulfilled.match(result)) {
            const user = result.payload;
            dispatch(
              setUser({
                ...user,
                ...USER_DEFAULT_VALUES,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: user.role as UserRole,
              })
            );
            dispatch(setAuthenticated(true));

            // Set user preferences for audio service (if available)
            if ('preferences' in user && user.preferences) {
              const mergedPreferences = mergeWithDefaults(user.preferences);
              audioService.setUserPreferences(mergedPreferences);
            }
          }
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
          {/* Public routes */}
          <Route path='/' element={<HomeView />} />
          <Route path='/game' element={<HomeView />} />
          <Route path='/play' element={<HomeView />} />
          <Route path='/start' element={<HomeView />} />
          <Route path='/leaderboard' element={<LeaderboardView />} />

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

          {/* Public routes - redirect if authenticated */}
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

          {/* Unauthorized page */}
          <Route path='/unauthorized' element={<UnauthorizedView />} />

          {/* 404 */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
