import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { CallbackStatus, ERROR_MESSAGES, OAuthErrorType, TIME_PERIODS_MS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import {
	AlertVariant,
	ButtonSize,
	Colors,
	ComponentSize,
	QUERY_KEYS,
	ROUTES,
	STORAGE_KEYS,
	VariantBase,
} from '@/constants';
import { Alert, AlertDescription, AlertIcon, Button, Card, HomeButton, Spinner } from '@/components';
import { authService, clientLogger as logger, queryClient, queryInvalidationService, storageService } from '@/services';
import { cn } from '@/utils';

export function OAuthCallback() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [status, setStatus] = useState<CallbackStatus>(CallbackStatus.PROCESSING);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<string | null>(null);

	useEffect(() => {
		logger.authDebug('OAuthCallback component mounted');

		const handleOAuthCallback = async () => {
			try {
				// Log all search params for debugging
				const params: Record<string, string> = {};
				for (const [key, value] of searchParams.entries()) {
					params[key] = value;
				}
				logger.authDebug('OAuth callback search params', { params });

				// Get parameters from URL (auth is via cookie; no token in URL)
				const success = searchParams.get('success');
				const error = searchParams.get('error');
				const errorDescription = searchParams.get('error_description');

				logger.authDebug('OAuth callback received', {
					success: success === 'true',
					errorInfo: {
						message: error ?? undefined,
						description: errorDescription ?? undefined,
					},
				});

				// Handle error in callback
				if (error) {
					// Create object for getErrorMessage to handle OAuth errors with description
					const oauthErrorObj = errorDescription ? { error, error_description: errorDescription } : error;
					const userMessage = getErrorMessage(oauthErrorObj);

					logger.authError('OAuth error received', {
						errorInfo: {
							message: error,
							description: errorDescription ?? undefined,
						},
						errorType: error === OAuthErrorType.INVALID_CLIENT ? 'configuration' : 'authentication',
					});

					setErrorMessage(userMessage);
					setErrorType(error);
					setStatus(CallbackStatus.ERROR);

					// Redirect after delay
					setTimeout(() => {
						const errorParam =
							error === OAuthErrorType.INVALID_CLIENT ? OAuthErrorType.INVALID_CLIENT : OAuthErrorType.OAUTH_FAILED;
						navigate(`${ROUTES.LOGIN}?error=${errorParam}`, { replace: true });
					}, TIME_PERIODS_MS.FIVE_SECONDS);
					return;
				}

				// Check for success flag with tokens from server redirect
				if (success === 'true') {
					logger.authDebug('OAuth success confirmed, proceeding with user authentication');

					const accessToken = searchParams.get('accessToken');
					const refreshToken = searchParams.get('refreshToken');

					if (!accessToken) {
						logger.authError('OAuth callback missing access token');
						throw new Error(ERROR_MESSAGES.user.FAILED_TO_RETRIEVE_USER_DATA);
					}

					await storageService.set(STORAGE_KEYS.AUTH_TOKEN, accessToken);
					if (refreshToken) {
						await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
					}
					window.dispatchEvent(new Event('auth-token-changed'));

					logger.authDebug('Attempting to get current user');
					const user = await authService.getCurrentUser();
					logger.authDebug('User data received', {
						userId: user?.id,
						emails: { current: user?.email ?? undefined },
					});

					if (!user) {
						logger.authError('Failed to retrieve user data - user is null');
						throw new Error(ERROR_MESSAGES.user.FAILED_TO_RETRIEVE_USER_DATA);
					}

					logger.authDebug('Setting user in React Query cache');
					queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), user);
					queryInvalidationService.invalidateAuthQueries(queryClient);

					logger.authLogin('User authenticated successfully', { userId: user.id });

					// Check if user needs to complete profile
					const needsProfile = !user.firstName;
					const redirectTo = needsProfile ? ROUTES.COMPLETE_PROFILE : ROUTES.HOME;

					logger.authDebug('Redirecting user', {
						needsProfile,
						redirectTo,
					});

					// Redirect immediately without showing success screen
					if (needsProfile) {
						navigate(ROUTES.COMPLETE_PROFILE, { replace: true });
					} else {
						navigate(ROUTES.HOME, { replace: true });
					}
				} else {
					// No success flag
					logger.authError('OAuth callback without success parameter', { params });
					setErrorMessage(getErrorMessage(OAuthErrorType.NO_TOKEN));
					setErrorType(OAuthErrorType.NO_TOKEN);
					setStatus(CallbackStatus.ERROR);

					setTimeout(() => {
						navigate(`${ROUTES.LOGIN}?error=${OAuthErrorType.NO_TOKEN}`, { replace: true });
					}, TIME_PERIODS_MS.THREE_SECONDS);
				}
			} catch (error) {
				const message = getErrorMessage(error);
				logger.authError('Unexpected error in OAuth callback', {
					errorInfo: { message },
					stack: error instanceof Error ? error.stack : undefined,
				});
				setErrorMessage(message);
				setErrorType(OAuthErrorType.UNEXPECTED_ERROR);
				setStatus(CallbackStatus.ERROR);

				setTimeout(() => {
					navigate(`${ROUTES.LOGIN}?error=${OAuthErrorType.UNEXPECTED_ERROR}`, { replace: true });
				}, TIME_PERIODS_MS.THREE_SECONDS);
			}
		};

		handleOAuthCallback();
	}, [searchParams, navigate]);

	return (
		<motion.main
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className='min-h-screen flex items-center justify-center px-4'
		>
			<Card className='w-full max-w-md p-8'>
				{status === CallbackStatus.PROCESSING && (
					<div className='text-center space-y-4'>
						<Spinner size={ComponentSize.XL} className='mx-auto' />
						<div>
							<h2 className='text-xl font-semibold mb-2'>Completing Sign In</h2>
							<p className='text-muted-foreground'>Please wait while we verify your credentials...</p>
						</div>
					</div>
				)}

				{status === CallbackStatus.ERROR && (
					<div className='space-y-4'>
						<Alert variant={AlertVariant.DESTRUCTIVE}>
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>

						{/* Show additional info for configuration errors */}
						{errorType === OAuthErrorType.INVALID_CLIENT && (
							<Alert>
								<AlertIcon />
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
							<div
								className={cn(
									'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
									`${Colors.RED_500.bg}/10`
								)}
							>
								<AlertIcon size='xl' className={Colors.RED_500.text} />
							</div>
							<div>
								<h2 className='text-xl font-semibold mb-2'>Authentication Failed</h2>
								<p className='text-muted-foreground'>We couldn't complete your sign in.</p>
								<p className='text-sm text-muted-foreground mt-2'>Redirecting you back to the login page...</p>
							</div>
							<div className='flex gap-2 justify-center'>
								<Button onClick={() => window.location.reload()} variant={VariantBase.OUTLINE} size={ButtonSize.LG}>
									Try Again
								</Button>
								<HomeButton />
							</div>
						</div>
					</div>
				)}
			</Card>
		</motion.main>
	);
}
