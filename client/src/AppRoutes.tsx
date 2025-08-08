import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import HomeView from './views/home';
import UserProfile from './views/user';
import { GameHistory } from './views/game-history';
import { Leaderboard } from './views/leaderboard';
import { NotFound } from './shared/components/NotFound';
import Navigation from './shared/components/Navigation';
import OAuthCallback from './shared/components/OAuthCallback';
import CompleteProfile from './shared/components/CompleteProfile';
import { authService } from './shared/services';
import { setUser, setAuthenticated } from './redux/features/userSlice';

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
      <Navigation />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/history" element={<GameHistory />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
