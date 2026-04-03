import { Fragment, useEffect } from 'react';
import { PersistGate } from 'redux-persist/integration/react';

import { ErrorCode } from '@shared/constants';
import { ensureErrorObject, getErrorMessage, hasProperty, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { FullPageSpinnerLayout, LoadingMessages } from '@/constants';
import { authService, gameService, clientLogger as logger, prefetchCommonQueries } from '@/services';
import { AppAuthBootstrap, BackgroundAnimation, ErrorBoundary, FullPageSpinner, LocaleSync } from '@/components';
import { selectGameId } from '@/redux/selectors';
import { resetGameSession, resetLeaderboardPeriod, resetMultiplayer } from '@/redux/slices';
import { persistor, store } from '@/redux/store';
import AppRoutes from './AppRoutes';

export default function App() {
	useEffect(() => {
		const unregisterLogout = authService.registerLogoutCallback(() => {
			store.dispatch(resetGameSession());
			store.dispatch(resetMultiplayer());
			store.dispatch(resetLeaderboardPeriod());
		});

		const handleError = (event: ErrorEvent) => {
			if (event.error instanceof Error) {
				logger.systemError(event.error, {
					contextMessage: 'Unhandled JavaScript error',
					message: event.message,
					url: event.filename,
					path: event.filename,
				});
			} else {
				logger.systemError('Unhandled JavaScript error', {
					message: event.message,
					url: event.filename,
					path: event.filename,
				});
			}
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const errorMessage = event.reason ? getErrorMessage(event.reason) : 'Unknown reason';

			const isAbortError =
				errorMessage === 'Request was cancelled' ||
				errorMessage.includes('aborted') ||
				errorMessage === 'signal is aborted without reason' ||
				(isRecord(event.reason) &&
					'statusCode' in event.reason &&
					event.reason.statusCode === 0 &&
					hasProperty(event.reason, 'details') &&
					isRecord(event.reason.details) &&
					event.reason.details.error === 'Request was cancelled') ||
				(event.reason instanceof Error && event.reason.name === 'AbortError');

			if (isAbortError) {
				return;
			}

			const errorCode =
				isRecord(event.reason) && 'code' in event.reason && VALIDATORS.string(event.reason.code)
					? event.reason.code
					: undefined;

			const isExpectedAuthError =
				errorCode === ErrorCode.USER_NOT_AUTHENTICATED ||
				errorCode === ErrorCode.AUTHENTICATION_TOKEN_REQUIRED ||
				errorCode === ErrorCode.INVALID_CREDENTIALS ||
				errorCode === ErrorCode.INVALID_AUTHENTICATION_TOKEN ||
				errorCode === ErrorCode.UNAUTHORIZED ||
				errorCode === ErrorCode.VALIDATION_ERROR;

			if (!isExpectedAuthError) {
				if (event.reason instanceof Error) {
					logger.systemError(event.reason, {
						contextMessage: 'Unhandled promise rejection',
						reason: errorMessage,
						errorCode,
					});
				} else {
					logger.systemError('Unhandled promise rejection', {
						reason: errorMessage,
						errorCode,
					});
				}
			}
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		const initializeApp = async () => {
			try {
				await prefetchCommonQueries();
				logger.appStartup();

				const gameId = selectGameId(store.getState());
				if (gameId) {
					try {
						const validationResult = await gameService.validateSession(gameId);
						if (!validationResult.isValid) {
							store.dispatch(resetGameSession());
							logger.gameInfo('Game session out of sync, reset Redux state', {
								gameId,
							});
						} else {
							logger.gameInfo('Game session validated successfully', {
								gameId,
							});
						}
					} catch (validationError) {
						store.dispatch(resetGameSession());
						logger.gameError('Failed to validate game session, reset Redux state', {
							errorInfo: { message: getErrorMessage(validationError) },
							gameId,
						});
					}
				}
			} catch (error) {
				logger.systemError(ensureErrorObject(error), {
					contextMessage: 'Failed to initialize app',
				});
			}
		};

		void initializeApp();

		return () => {
			unregisterLogout();
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	}, []);

	return (
		<ErrorBoundary>
			<PersistGate
				loading={
					<div className='app-shell'>
						<BackgroundAnimation />
						<FullPageSpinner
							message={LoadingMessages.LOADING_APP}
							layout={FullPageSpinnerLayout.APP_SHELL}
							showHomeButton={false}
						/>
					</div>
				}
				persistor={persistor}
			>
				<Fragment>
					<LocaleSync />
					<AppAuthBootstrap>
						<AppRoutes />
					</AppAuthBootstrap>
				</Fragment>
			</PersistGate>
		</ErrorBoundary>
	);
}
