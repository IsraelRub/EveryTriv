import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { CallbackStatus, ERROR_MESSAGES, OAuthErrorType, TIME_PERIODS_MS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import {
	AlertIconSize,
	AlertVariant,
	AuthKey,
	ButtonSize,
	ComponentSize,
	QUERY_KEYS,
	Routes,
	SEMANTIC_ICON_TEXT,
	StorageKeys,
	VariantBase,
} from '@/constants';
import { authService, clientLogger as logger, queryClient, queryInvalidationService, storageService } from '@/services';
import {
	applyPostLoginNavigation,
	cn,
	getAuthCurrentUserQueryKey,
	readAuthTokenSnapshotForQueryKey,
	safeSessionStorageRemove,
} from '@/utils';
import { Alert, AlertDescription, AlertIcon, Button, Card, HomeButton, Spinner } from '@/components';

export function OAuthCallback() {
	const { t } = useTranslation();
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

				// Callback may include tokens in query (server redirect) or error params
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
					safeSessionStorageRemove(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION);
					safeSessionStorageRemove(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR);
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

					// Redirect to home after delay (user can try login again from nav)
					setTimeout(() => {
						const errorParam =
							error === OAuthErrorType.INVALID_CLIENT ? OAuthErrorType.INVALID_CLIENT : OAuthErrorType.OAUTH_FAILED;
						navigate(Routes.HOME, { state: { authError: errorParam }, replace: true });
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

					await storageService.setString(StorageKeys.AUTH_TOKEN, accessToken);
					if (refreshToken) {
						await storageService.setString(StorageKeys.REFRESH_TOKEN, refreshToken);
						await storageService.setString(StorageKeys.PERSISTENT_REFRESH_TOKEN, refreshToken);
					}

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
					try {
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.auth.all, exact: false });
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user.profile() });
					} catch (cancelError) {
						logger.userDebug('OAuth callback: cancelQueries before cache write failed (ignored)', {
							errorInfo: { message: getErrorMessage(cancelError) },
						});
					}
					queryClient.setQueryData(getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()), user, {
						updatedAt: Date.now(),
					});
					await queryInvalidationService.invalidateAuthQueries(queryClient);

					logger.authLogin('User authenticated successfully', { userId: user.id });

					if (!user.needsLegalAcceptance) {
						safeSessionStorageRemove(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION);
						safeSessionStorageRemove(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR);
					}

					logger.authDebug('Redirecting user after OAuth', {
						needsProfile: !user.firstName,
					});

					applyPostLoginNavigation(navigate, user);
				} else {
					safeSessionStorageRemove(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION);
					safeSessionStorageRemove(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR);
					// No success flag
					logger.authError('OAuth callback without success parameter', { params });
					setErrorMessage(getErrorMessage(OAuthErrorType.NO_TOKEN));
					setErrorType(OAuthErrorType.NO_TOKEN);
					setStatus(CallbackStatus.ERROR);

					setTimeout(() => {
						navigate(Routes.HOME, { state: { authError: OAuthErrorType.NO_TOKEN }, replace: true });
					}, TIME_PERIODS_MS.THREE_SECONDS);
				}
			} catch (error) {
				safeSessionStorageRemove(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION);
				safeSessionStorageRemove(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR);
				const message = getErrorMessage(error);
				logger.authError('Unexpected error in OAuth callback', {
					errorInfo: { message },
					stack: error instanceof Error ? error.stack : undefined,
				});
				setErrorMessage(message);
				setErrorType(OAuthErrorType.UNEXPECTED_ERROR);
				setStatus(CallbackStatus.ERROR);

				setTimeout(() => {
					navigate(Routes.HOME, { state: { authError: OAuthErrorType.UNEXPECTED_ERROR }, replace: true });
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
							<h2 className='text-xl font-semibold mb-2'>{t(AuthKey.COMPLETING_SIGN_IN)}</h2>
							<p className='text-muted-foreground'>{t(AuthKey.PLEASE_WAIT_VERIFY_CREDENTIALS)}</p>
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
									<p className='font-semibold mb-1'>{t(AuthKey.CONFIGURATION_ISSUE)}</p>
									<p className='text-sm'>{t(AuthKey.CONFIGURATION_ISSUE_DESCRIPTION)}</p>
								</AlertDescription>
							</Alert>
						)}

						<div className='text-center space-y-4'>
							<div
								className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto', 'bg-destructive/10')}
							>
								<AlertIcon size={AlertIconSize.XL} className={SEMANTIC_ICON_TEXT.destructive} />
							</div>
							<div>
								<h2 className='text-xl font-semibold mb-2'>{t(AuthKey.AUTHENTICATION_FAILED)}</h2>
								<p className='text-muted-foreground'>{t(AuthKey.COULD_NOT_COMPLETE_SIGN_IN)}</p>
								<p className='text-sm text-muted-foreground mt-2'>{t(AuthKey.REDIRECTING_TO_LOGIN)}</p>
							</div>
							<div className='flex gap-2 justify-center'>
								<Button onClick={() => window.location.reload()} variant={VariantBase.OUTLINE} size={ButtonSize.LG}>
									{t(AuthKey.TRY_AGAIN)}
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
