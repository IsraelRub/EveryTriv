import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { logout } from '../../redux/features/userSlice';
import { authService } from '../services';
import { Button } from '../styles/ui';
import { cn } from '../utils/cn';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, credits } = useSelector((state: RootState) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    dispatch(logout());
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleGoogleLogin = () => {
    authService.initiateGoogleLogin();
  };

  const isHomePage = location.pathname === '/';

  const menuItems = [
    { label: 'Game History', path: '/history', icon: '📊' },
    { label: 'Start Game', path: '/game', icon: '🎮' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ];

  if (isAuthenticated) {
    menuItems.push({ label: 'Profile', path: '/profile', icon: '👤' });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - only show when NOT on home page */}
          <div className="flex items-center">
            {!isHomePage ? (
              <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img src="/assets/logo.svg" alt="EveryTriv" className="h-10 w-10" />
                <span className="text-xl font-bold text-white">EveryTriv</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <img src="/assets/logo.svg" alt="EveryTriv" className="h-8 w-8" />
                <span className="text-lg font-bold text-white/80">EveryTriv</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Credits Display */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-lg">
                <span className="text-yellow-400">💰</span>
                <span className="text-white font-medium">{credits}</span>
              </div>
            )}

            {/* Navigation Items */}
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-white">
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm">{user?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-300 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGoogleLogin}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-700"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Credits Display */}
                {isAuthenticated && (
                  <div className="flex items-center justify-center space-x-2 bg-slate-800 px-3 py-2 rounded-lg mb-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-white font-medium">{credits} Credits</span>
                  </div>
                )}

                {/* Navigation Items */}
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                    )}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                {/* Auth Section */}
                {isAuthenticated ? (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2 px-3 py-2 text-white">
                      {user?.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span>{user?.username}</span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full text-left text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-700">
                    <Button
                      variant="primary"
                      onClick={handleGoogleLogin}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Sign in with Google
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
