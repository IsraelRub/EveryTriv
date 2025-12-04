import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Alert, AlertDescription, Button, Card } from '@/components';
import { CLIENT_STORAGE_KEYS, OAUTH_ERROR_TYPES } from '@/constants';
import { useAppDispatch } from '@/hooks';
import { setAuthenticated, setUser } from '@/redux/slices';
import { authService, storageService } from '@/services';
import type { CallbackStatus } from '@/types';

/**
 * Get user-friendly error message based on OAuth error type
 */
function getOAuthErrorMessage(error: string, errorDescription?: string | null): string {
	if (error === OAUTH_ERROR_TYPES.INVALID_CLIENT) {
		return 'Invalid OAuth client configuration. Please contact the administrator.';
	}
	if (errorDescription) {
		return decodeURIComponent(errorDescription);
	}
	return error || 'OAuth authentication failed';
}

/**
 * OAuth Callback Handler
 * @description Handles OAuth authentication callback from Google/other providers
 */
export function OAuthCallback() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [searchParams] = useSearchParams();

	const [status, setStatus] = useState<CallbackStatus>('processing');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<string | null>(null);

	useEffect(() => {
		logger.authLogin('OAuthCallback component mounted');

		const handleOAuthCallback = async () => {
			try {
				// Log all search params for debugging
				const params: Record<string, string> = {};
				for (const [key, value] of searchParams.entries()) {
					params[key] = value;
				}
				logger.authDebug('OAuth callback search params', { params });

				// Get parameters from URL
				const success = searchParams.get('success');
				const token = searchParams.get('token');
				const error = searchParams.get('error');
				const errorDescription = searchParams.get('error_description');

				logger.authLogin('OAuth callback received', {
					success: success === 'true',
					token: token || undefined,
					error: error || undefined,
					errorDescription: errorDescription || undefined,
				});

				// Handle error in callback
				if (error) {
					const userMessage = getOAuthErrorMessage(error, errorDescription);

					logger.authError('OAuth error received', {
						error,
						errorDescription: errorDescription || undefined,
						errorType: error === OAUTH_ERROR_TYPES.INVALID_CLIENT ? 'configuration' : 'authentication',
					});

					setErrorMessage(userMessage);
					setErrorType(error);
					setStatus('error');

					// Redirect after delay
					setTimeout(() => {
						const errorParam =
							error === OAUTH_ERROR_TYPES.INVALID_CLIENT
								? OAUTH_ERROR_TYPES.INVALID_CLIENT
								: OAUTH_ERROR_TYPES.OAUTH_FAILED;
						navigate(`/login?error=${errorParam}`, { replace: true });
					}, 5000);
					return;
				}

				// Check for success flag or token
				if (success === 'true' || token) {
					logger.authLogin('OAuth success confirmed, proceeding with user authentication');

					// Store token if provided
					if (token) {
						logger.authDebug('Storing authentication token');
						await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, token);

						// Verify token was stored
						const storedToken = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
						if (!storedToken.success || !storedToken.data) {
							logger.authError('Failed to store authentication token', {
								success: storedToken.success,
								hasData: Boolean(storedToken.data),
							});
							throw new Error('Failed to store authentication token');
						}
						logger.authDebug('Token stored successfully');
					}

					// Get user data
					logger.authDebug('Attempting to get current user');
					const user = await authService.getCurrentUser();
					logger.authDebug('User data received', {
						userId: user?.id,
						email: user?.email || undefined,
					});

					if (!user) {
						logger.authError('Failed to retrieve user data - user is null');
						throw new Error('Failed to retrieve user data');
					}

					// Update Redux state
					logger.authDebug('Setting user in Redux store');
					dispatch(setAuthenticated(true));
					dispatch(setUser(user));

					logger.authLogin('User authenticated successfully', { userId: user.id });
					setStatus('success');

					// Redirect after short delay
					setTimeout(() => {
						// Check if user needs to complete profile
						const userProfile = user as { firstName?: string };
						const needsProfile = !userProfile.firstName;
						const redirectTo = needsProfile ? '/complete-profile' : '/';

						logger.authDebug('Redirecting user', {
							needsProfile,
							redirectTo,
						});

						if (needsProfile) {
							navigate('/complete-profile', { replace: true });
						} else {
							navigate('/', { replace: true });
						}
					}, 1500);
				} else {
					// No success flag and no token
					logger.authError('OAuth callback without success parameter or token', { params });
					setErrorMessage('No approval received from server');
					setErrorType(OAUTH_ERROR_TYPES.NO_TOKEN);
					setStatus('error');

					setTimeout(() => {
						navigate(`/login?error=${OAUTH_ERROR_TYPES.NO_TOKEN}`, { replace: true });
					}, 3000);
				}
			} catch (error) {
				const message = getErrorMessage(error);
				logger.authError('Unexpected error in OAuth callback', {
					error: message,
					stack: error instanceof Error ? error.stack : undefined,
				});
				setErrorMessage(message || 'Authentication failed. Please try again.');
				setErrorType(OAUTH_ERROR_TYPES.UNEXPECTED_ERROR);
				setStatus('error');

				setTimeout(() => {
					navigate(`/login?error=${OAUTH_ERROR_TYPES.UNEXPECTED_ERROR}`, { replace: true });
				}, 3000);
			}
		};

		handleOAuthCallback();
	}, [searchParams, dispatch, navigate]);

	logger.authDebug('OAuthCallback render', { status, hasErrors: Boolean(errorMessage) });

	return (
		<motion.main
			role='main'
			aria-label='OAuth Callback'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className='min-h-screen flex items-center justify-center px-4'
		>
			<Card className='w-full max-w-md p-8'>
				{status === 'processing' && (
					<div className='text-center space-y-4'>
						<div className='spinner-pulsing w-12 h-12 mx-auto' />
						<div>
							<h2 className='text-xl font-semibold mb-2'>Completing Sign In</h2>
							<p className='text-muted-foreground'>Please wait while we verify your credentials...</p>
						</div>
					</div>
				)}

				{status === 'success' && (
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className='text-center space-y-4'
					>
						<div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
							<CheckCircle2 className='w-10 h-10 text-green-600' />
						</div>
						<div>
							<h2 className='text-xl font-semibold mb-2'>Sign In Successful!</h2>
							<p className='text-muted-foreground'>Redirecting you to the app...</p>
						</div>
					</motion.div>
				)}

				{status === 'error' && (
					<div className='space-y-4'>
						<Alert variant='destructive'>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>

						{/* Show additional info for configuration errors */}
						{errorType === OAUTH_ERROR_TYPES.INVALID_CLIENT && (
							<Alert>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>
									<p className='font-semibold mb-1'>Configuration Issue</p>
									<p className='text-sm'>
										This error usually means the Google OAuth client ID or secret is not configured correctly. Please
										contact the administrator to verify the OAuth settings.
									</p>
								</AlertDescription>
							</Alert>
						)}

						<div className='text-center space-y-4'>
							<div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto'>
								<AlertCircle className='w-10 h-10 text-red-600' />
							</div>
							<div>
								<h2 className='text-xl font-semibold mb-2'>Authentication Failed</h2>
								<p className='text-muted-foreground'>We couldn't complete your sign in.</p>
								<p className='text-sm text-muted-foreground mt-2'>Redirecting you back to the login page...</p>
							</div>
							<div className='flex gap-2 justify-center'>
								<Button onClick={() => window.location.reload()} variant='default'>
									Try Again
								</Button>
								<Button onClick={() => navigate('/')} variant='outline'>
									Go Home
								</Button>
							</div>
						</div>
					</div>
				)}
			</Card>
		</motion.main>
	);
}
