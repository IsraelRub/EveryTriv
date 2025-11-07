import { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistGate } from 'redux-persist/integration/react';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import AppRoutes from './AppRoutes';
import { AnimatedBackground, ErrorBoundary } from './components';
import { AudioKey } from './constants';
import { useCurrentUser } from './hooks';
import { setUser } from './redux/slices';
import { persistor } from './redux/store';
import { audioService, prefetchCommonQueries } from './services';
import type { RootState } from './types';

const AudioContext = createContext(audioService);

export const useAudio = () => useContext(AudioContext);

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
				<AudioContext.Provider value={audioService}>
					<AnimatedBackground
						intensity='medium'
						theme='blue'
						particles={true}
						particlesCount={20}
						animationSpeed={1.2}
						enableParticles={true}
						enableGradients={true}
						enableFloating={true}
					>
						<AppRoutes />
						{/* React Query DevTools - only in development */}
						{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
					</AnimatedBackground>
				</AudioContext.Provider>
			</PersistGate>
		</ErrorBoundary>
	);
}

export default App;
