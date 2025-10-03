import { clientLogger, getErrorMessage } from '@shared';
import type { UserRole } from '@shared/types/domain/user/user.types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { setAuthenticated, setUser } from '@/redux/slices/userSlice';
import { authService } from '@/services/auth';

import { USER_DEFAULT_VALUES } from '../../constants';
import { fadeInUp, scaleIn } from '../animations';
import { Icon } from '../icons';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientLogger.authLogin('OAuthCallback component mounted');
    const handleCallback = async () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        clientLogger.authLogin('OAuth callback received', {
          success: success || 'No success',
          error: error || 'No error',
        });
        clientLogger.authDebug('Search params', {
          params: Object.fromEntries(searchParams.entries()) as Record<string, string>,
        });

        if (error) {
          clientLogger.authError('OAuth error received', { error: error || 'Unknown error' });
          clientLogger.authError('OAuth error details', { error: error || 'Unknown error' });
          setError(error);
          setTimeout(() => {
            navigate('/login?error=oauth_failed');
          }, 3000);
          return;
        }

        if (success === 'true') {
          clientLogger.authLogin('OAuth success confirmed, proceeding with user authentication...');
          try {
            // Get user data (token is already set in cookie by server)
            clientLogger.authDebug('Attempting to get current user...');
            const user = await authService.getCurrentUser();
            clientLogger.authDebug('User data received', { user });
            clientLogger.authDebug('Setting user in Redux store...');
            dispatch(
              setUser({
                ...user,
                ...USER_DEFAULT_VALUES,
                authProvider: 'google', // Override for OAuth
                role: user.role as UserRole,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            );
            dispatch(setAuthenticated(true));

            // Navigate to home or profile completion
            if (!user?.username) {
              clientLogger.authLogin('User has no fullName, navigating to complete-profile');
              navigate('/complete-profile');
            } else {
              clientLogger.authLogin('User has fullName, navigating to home');
              navigate('/');
            }
          } catch (error) {
            clientLogger.authError('Failed to get current user', {
              error: getErrorMessage(error),
            });
            clientLogger.authError('Failed to handle OAuth callback', {
              error: getErrorMessage(error),
            });
            setError('Error receiving user details');
            setTimeout(() => {
              navigate('/login?error=oauth_failed');
            }, 3000);
          }
        } else {
          clientLogger.authError('OAuth callback without success parameter');
          clientLogger.authError('OAuth callback without success parameter');
          setError('No approval received from server');
          setTimeout(() => {
            navigate('/login?error=no_token');
          }, 3000);
        }
      } catch (error) {
        clientLogger.authError('Unexpected error in OAuth callback', {
          error: getErrorMessage(error),
        });
        clientLogger.authError('Unexpected error in OAuth callback details', {
          error: getErrorMessage(error),
        });
        setError('Unexpected error');
        setTimeout(() => {
          navigate('/login?error=unexpected_error');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  clientLogger.authDebug('OAuthCallback render - error state', { error: error || 'No error' });

  if (error) {
    clientLogger.authDebug('Rendering error state', { error: error || 'No error' });
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-700'>
        <motion.div variants={scaleIn} initial='hidden' animate='visible' className='text-center'>
          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.2 }}
          >
            <div className='text-red-200 mb-4'>
              <Icon name='alert-triangle' size='2xl' />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.4 }}
          >
            <h1 className='text-white text-2xl font-bold mb-4'>Authentication Error</h1>
            <p className='text-white text-lg mb-6'>An error occurred during the login process</p>
            <p className='text-red-200 text-sm mb-4'>Error details: {error}</p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => window.location.reload()}
              className='bg-white text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
            >
              Try Again
            </button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.8 }}
          >
            <p className='text-white text-sm opacity-75 mt-4'>
              Redirecting you back to the login page...
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700'>
      <motion.div variants={scaleIn} initial='hidden' animate='visible' className='text-center'>
        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.2 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto'></div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.4 }}
        >
          <p className='text-white text-lg mt-4'>Completing authentication...</p>
          <p className='text-white text-sm mt-2 opacity-75'>Please wait...</p>
          <p className='text-white text-xs mt-1 opacity-50'>
            If the process takes too long, try refreshing the page
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => window.location.reload()}
            className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-30 transition-colors'
          >
            Refresh Page
          </button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.8 }}
        >
          <p className='text-white text-xs mt-2 opacity-50'>
            If the problem persists, check the console for more details
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
