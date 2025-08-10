import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import HomeView from './views/home';
import UserProfile from './views/user';
import { GameHistory } from './views/game-history';
import { Leaderboard } from './views/leaderboard';
import { PrivacyPolicy, TermsOfService, CookiePolicy } from './views/legal';
import { HelpCenter } from './views/help';
import { NotFound } from './shared/components/layout';
import Navigation from './shared/components/navigation/Navigation';
import { OAuthCallback, CompleteProfile } from './shared/components/user';
import { authService } from './shared/services';
import { setUser, setAuthenticated } from './redux/features/userSlice';
import logger from './shared/services/logger.service';

// Navigation tracker component
function NavigationTracker() {
  const location = useLocation();
  
  useEffect(() => {
    logger.user(`🧭 Page navigation`, {
      path: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString(),
      type: 'spa_navigation'
    });
  }, [location]);
  
  return null;
}

export default function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already authenticated on app load
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          dispatch(setUser(user));
          dispatch(setAuthenticated(true));
        } catch (error) {
          // Token might be expired, logout
          authService.logout();
        }
      }
    };

    initAuth();
  }, [dispatch]);

  return (
    <Router>
      <NavigationTracker />
      <Navigation />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/history" element={<GameHistory />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
