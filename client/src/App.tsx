import AppRoutes from './AppRoutes';
import { AnimatedBackground } from './shared/components/animations';
import { AudioProvider } from './shared/context/AudioContext';
import { AudioControls } from './shared/components/AudioControls';
import { useBackgroundMusic } from './shared/hooks/useBackgroundMusic';

function App() {
  useBackgroundMusic();

  return (
    <AudioProvider>
      <AnimatedBackground>
        <div className="fixed top-4 right-4 z-50">
          <AudioControls />
        </div>
        <AppRoutes />
      </AnimatedBackground>
    </AudioProvider>
  );
}

export default App;
