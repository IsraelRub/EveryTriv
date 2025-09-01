import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';

import AppRoutes from './AppRoutes';
import { AnimatedBackground } from './components/animations';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AudioProvider } from './hooks/contexts/AudioContext';
import { PerformanceProvider } from './hooks/contexts/PerformanceContext';
import { logger } from './services/utils';
import { prefetchCommonQueries } from './services/utils/queryClient';

/**
 * Main application component
 * 
 * @component App
 * @description Root application component with providers, error boundaries, and initialization logic
 * @returns JSX.Element The rendered application with all necessary providers and components
 */
function App() {
	useEffect(() => {
		const initializeApp = async () => {
			try {
				await prefetchCommonQueries();
				    logger.appStartup();
			} catch (error) {
				logger.systemError('Failed to initialize app', { 
					error: error instanceof Error ? error.message : String(error) 
				});
			}
		};

		initializeApp();
	}, []);

	return (
		<ErrorBoundary>
			<PerformanceProvider>
				<AudioProvider>
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
				</AudioProvider>
			</PerformanceProvider>
		</ErrorBoundary>
	);
}

export default App;
