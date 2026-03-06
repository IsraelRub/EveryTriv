import { useEffect } from 'react';

import { ErrorCode } from '@shared/constants';
import { ensureErrorObject, getErrorMessage, hasProperty, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { gameService, clientLogger as logger, prefetchCommonQueries } from '@/services';
import { selectGameId } from '@/redux/selectors';
import { resetGameSession } from '@/redux/slices';
import { store } from '@/redux/store';

export const useAppInitialization = () => {
	useEffect(() => {
		// Setup global error handlers
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

			// Check if error is an abort/cancellation error - these are expected and shouldn't be logged
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

			// Skip logging abort errors - they're expected when React Query cancels previous requests
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

				// Check game session synchronization: if gameId exists in Redux, validate it with Redis
				const gameId = selectGameId(store.getState());
				if (gameId) {
					try {
						const validationResult = await gameService.validateSession(gameId);
						if (!validationResult.isValid) {
							// Session is out of sync - reset Redux state to prevent displaying stale/corrupted state
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
						// If validation fails, reset to be safe
						store.dispatch(resetGameSession());
						logger.gameError('Failed to validate game session, reset Redux state', {
							errorInfo: { message: getErrorMessage(validationError) },
							gameId,
						});
					}
				}

				// Note: Audio settings are loaded in AudioControls component
				// Background music will start automatically after first user interaction
				// via setupUserInteractionListener in AudioService
			} catch (error) {
				logger.systemError(ensureErrorObject(error), {
					contextMessage: 'Failed to initialize app',
				});
			}
		};

		initializeApp();

		// Cleanup error handlers on unmount
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	}, []);
};
