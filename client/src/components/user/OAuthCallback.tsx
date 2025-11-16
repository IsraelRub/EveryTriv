import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { setAuthenticated, setUser } from '@/redux/slices';

import { ComponentSize } from '../../constants';
import { authService } from '../../services';
import { fadeInUp, scaleIn } from '../animations';
import { Icon } from '../IconLibrary';

export default function OAuthCallback() {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		logger.authLogin('OAuthCallback component mounted');
		const handleCallback = async () => {
			try {
				const success = searchParams.get('success');
				const error = searchParams.get('error');
				const params: Record<string, string> = {};
				for (const [key, value] of searchParams.entries()) {
					params[key] = value;
				}

				logger.authLogin('OAuth callback received', {
					success: success ? true : false,
					error: error || undefined,
				});
				logger.authDebug('Search params', { params });

				if (error) {
					logger.authError('OAuth error received', { error: error || 'Unknown error' });
					logger.authError('OAuth error details', { error: error || 'Unknown error' });
					setError(error);
					setTimeout(() => {
						navigate('/login?error=oauth_failed');
					}, 3000);
					return;
				}

				if (success === 'true') {
					logger.authLogin('OAuth success confirmed, proceeding with user authentication...');
					try {
						// Get user data (token is already set in cookie by server)
						logger.authDebug('Attempting to get current user...');
						const user = await authService.getCurrentUser();
						logger.authDebug('User data received', { user: user ? JSON.parse(JSON.stringify(user)) : undefined });
						logger.authDebug('Setting user in Redux store...');
						dispatch(setUser(user));
						dispatch(setAuthenticated(true));

						// Navigate to home or profile completion
						if (!user?.username) {
							logger.authLogin('User has no username, navigating to complete-profile');
							navigate('/complete-profile');
						} else {
							logger.authLogin('User has username, navigating to home');
							navigate('/');
						}
					} catch (error) {
						logger.authError('Failed to get current user', {
							error: getErrorMessage(error),
						});
						logger.authError('Failed to handle OAuth callback', {
							error: getErrorMessage(error),
						});
						setError('Error receiving user details');
						setTimeout(() => {
							navigate('/login?error=oauth_failed');
						}, 3000);
					}
				} else {
					logger.authError('OAuth callback without success parameter');
					logger.authError('OAuth callback without success parameter');
					setError('No approval received from server');
					setTimeout(() => {
						navigate('/login?error=no_token');
					}, 3000);
				}
			} catch (error) {
				logger.authError('Unexpected error in OAuth callback', {
					error: getErrorMessage(error),
				});
				logger.authError('Unexpected error in OAuth callback details', {
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

	logger.authDebug('OAuthCallback render - error state', { error: error || 'No error' });

	if (error) {
		logger.authDebug('Rendering error state', { error: error || 'No error' });
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-700'>
				<motion.div variants={scaleIn} initial='hidden' animate='visible' className='text-center'>
					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.2 }}>
						<div className='text-red-200 mb-4'>
							<Icon name='alert-triangle' size={ComponentSize.XXL} />
						</div>
					</motion.div>

					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.4 }}>
						<h1 className='text-white text-2xl font-bold mb-4'>Authentication Error</h1>
						<p className='text-white text-lg mb-6'>An error occurred during the login process</p>
						<p className='text-red-200 text-sm mb-4'>Error details: {error}</p>
					</motion.div>

					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.6 }}>
						<button
							onClick={() => window.location.reload()}
							className='bg-white text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
						>
							Try Again
						</button>
					</motion.div>

					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.8 }}>
						<p className='text-white text-sm opacity-75 mt-4'>Redirecting you back to the login page...</p>
					</motion.div>
				</motion.div>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700'>
			<motion.div variants={scaleIn} initial='hidden' animate='visible' className='text-center'>
				<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.2 }}>
					<motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
						<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto'></div>
					</motion.div>
				</motion.div>

				<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.4 }}>
					<p className='text-white text-lg mt-4'>Completing authentication...</p>
					<p className='text-white text-sm mt-2 opacity-75'>Please wait...</p>
					<p className='text-white text-xs mt-1 opacity-50'>If the process takes too long, try refreshing the page</p>
				</motion.div>

				<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.6 }}>
					<button
						onClick={() => window.location.reload()}
						className='mt-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-30 transition-colors'
					>
						Refresh Page
					</button>
				</motion.div>

				<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.8 }}>
					<p className='text-white text-xs mt-2 opacity-50'>
						If the problem persists, check the console for more details
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
}
