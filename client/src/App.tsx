import AppRoutes from './AppRoutes';
import { AnimatedBackground } from './shared/components/animations';
import { AdvancedAudioControls } from './shared/components/audio';
import AudioDiagnostics from './shared/components/audio/AudioDiagnostics';
import { Footer, FloatingHelpButton } from './shared/components/layout';
import { AudioProvider } from './shared/hooks';
import logger from './shared/services/logger.service';
import { useEffect } from 'react';


function App() {
  useEffect(() => {
    // Simple application startup logging
    logger.info('🚀 EveryTriv Client Application Started', {
      version: '1.0.0',
      environment: import.meta.env.MODE || 'development',
      timestamp: new Date().toISOString()
    });

    // Log when component unmounts (app shutdown)
    return () => {
      logger.info('👋 EveryTriv Client Application Shutting Down', {
        sessionDuration: performance.now(),
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  return (
    <AudioProvider>
      <div className="relative min-h-screen flex flex-col">
        <AnimatedBackground>
          {/* Audio Controls positioned absolutely */}
          <div className="fixed top-20 right-4 z-50">
            <AdvancedAudioControls />
          </div>
          
          {/* Main App Content */}
          <div className="relative z-10 flex-1">
            <AppRoutes />
          </div>
          
          {/* Footer */}
          <Footer />
          
          {/* Floating Help Button */}
          <FloatingHelpButton />
          
          {/* Audio Diagnostics */}
          <AudioDiagnostics />
        </AnimatedBackground>
      </div>
    </AudioProvider>
  );
}

export default App;
