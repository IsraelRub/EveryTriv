import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { PersistGate } from 'redux-persist/integration/react';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import AppRoutes from './AppRoutes';
import { ErrorBoundary } from './components';
import { AudioKey, CLIENT_STORAGE_KEYS } from './constants';
import { AudioProvider, useCurrentUser } from './hooks';
import { setUser } from './redux/slices';
import { persistor } from './redux/store';
import { audioService, prefetchCommonQueries, storageService } from './services';
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
		const initializeApp = async () => {
			try {
				await prefetchCommonQueries();
				logger.appStartup();

				// Load audio settings from storage before playing audio
				const storedMuted = await storageService.getBoolean(CLIENT_STORAGE_KEYS.AUDIO_MUTED);
				if (storedMuted.success && storedMuted.data !== undefined) {
					if (storedMuted.data) {
						audioService.mute();
					} else {
						audioService.unmute();
					}
				}

				const storedVolume = await storageService.getNumber(CLIENT_STORAGE_KEYS.AUDIO_VOLUME);
				if (storedVolume.success && storedVolume.data) {
					audioService.setMasterVolume(storedVolume.data);
				}

				audioService.play(AudioKey.BACKGROUND_MUSIC);
			} catch (error) {
				logger.systemError('Failed to initialize app', {
					error: getErrorMessage(error),
				});
			}
		};

		initializeApp();
	}, []);

	return (
		<ErrorBoundary>
			<PersistGate loading={null} persistor={persistor}>
				<AudioProvider>
					<AppRoutes />
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
