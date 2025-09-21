import { clientLogger } from '@shared';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createContext, useContext,useEffect } from 'react';
import { PersistGate } from 'redux-persist/integration/react';

import AppRoutes from './AppRoutes';
import { AnimatedBackground } from './components/animations';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AudioKey } from './constants';
import { persistor } from './redux/store';
import { audioService } from './services';
import { prefetchCommonQueries } from './services/utils/queryClient.service';

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
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await prefetchCommonQueries();
        clientLogger.appStartup();

        audioService.play(AudioKey.BACKGROUND_MUSIC);
      } catch (error) {
        clientLogger.systemError('Failed to initialize app', {
          error: error instanceof Error ? error.message : String(error),
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
