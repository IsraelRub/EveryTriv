import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { PersistGate } from 'redux-persist/integration/react';

import { getErrorMessage } from '@shared/utils';

import { clientLogger as logger, prefetchCommonQueries } from '@/services';

import AppRoutes from './AppRoutes';
import { BackgroundAnimation, ErrorBoundary, Toaster } from './components';
import { AudioProvider, useCurrentUser } from './hooks';
import { setUser } from './redux/slices';
import { persistor } from './redux/store';
import type { RootState } from './types';

// Dynamic import of React Query DevTools - only loaded in development
const ReactQueryDevtools = import.meta.env.DEV
	? lazy(() =>
			import('@tanstack/react-query-devtools').then(module => ({
				default: module.ReactQueryDevtools,
			}))
		)
	: null;

/**
 * Main application component
 *
 * @component App
 * @description Root application component with providers, error boundaries, and initialization logic
 * @returns JSX.Element The rendered application with all necessary providers and components
 */
function App() {
	const dispatch = useDispatch();
	const { isAuthenticated } = useSelector((state: RootState) => state.user);
	const { data: currentUser } = useCurrentUser();

	// Sync Redux with current user from server
	useEffect(() => {
		if (currentUser && isAuthenticated) {
			dispatch(setUser(currentUser));
			logger.authInfo('User data synced with Redux', { userId: currentUser.id });
		}
	}, [currentUser, isAuthenticated, dispatch]);

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

	return (
		<ErrorBoundary>
			<PersistGate loading={null} persistor={persistor}>
				<BackgroundAnimation />
				<AudioProvider>
					<AppRoutes />
					<Toaster />
					{/* React Query DevTools - only in development, loaded dynamically */}
					{import.meta.env.DEV && ReactQueryDevtools && (
						<Suspense fallback={null}>
							<ReactQueryDevtools initialIsOpen={false} />
						</Suspense>
					)}
				</AudioProvider>
			</PersistGate>
		</ErrorBoundary>
	);
}

export default App;
