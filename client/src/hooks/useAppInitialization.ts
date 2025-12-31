import { useEffect } from 'react';

import { getErrorMessage } from '@shared/utils';
import { clientLogger as logger, prefetchCommonQueries } from '@/services';

/**
 * Hook for app initialization and global error handling
 * Sets up error handlers and initializes app data
 */
export const useAppInitialization = () => {
	useEffect(() => {
		// Setup global error handlers
		const handleError = (event: ErrorEvent) => {
			logger.systemError('Unhandled JavaScript error', {
				message: event.message,
				error: event.error ? getErrorMessage(event.error) : undefined,
				stack: event.error?.stack,
				url: event.filename,
				path: event.filename,
			});
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const reason = event.reason ? getErrorMessage(event.reason) : 'Unknown reason';
			const errorMessage =
				typeof event.reason === 'object' && event.reason !== null && 'message' in event.reason
					? String(event.reason.message)
					: reason;

			// Ignore expected authentication errors (session expired, unauthorized, validation failed)
			const isExpectedAuthError =
				errorMessage.includes('Session expired') ||
				errorMessage.includes('Unauthorized') ||
				errorMessage.includes('Validation failed') ||
				errorMessage.includes('401') ||
				errorMessage.includes('400');

			if (!isExpectedAuthError) {
				logger.systemError('Unhandled promise rejection', {
					reason,
					stack: event.reason instanceof Error ? event.reason.stack : undefined,
				});
			}
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		const initializeApp = async () => {
			try {
				await prefetchCommonQueries();
				logger.appStartup();

				// Note: Audio settings are loaded in AudioControls component
				// Background music will start automatically after first user interaction
				// via setupUserInteractionListener in AudioService
			} catch (error) {
				logger.systemError('Failed to initialize app', {
					error: getErrorMessage(error),
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

