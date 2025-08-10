import { AUDIO_PATHS, AudioKey } from '@/shared/constants';
import { audioService } from '@/shared/services';
import { useState, useEffect } from 'react';
import { Button } from '../ui';

/**
 * Audio Diagnostics Component
 * Helps debug audio loading and playback issues
 * Only visible in development mode
 */
export const AudioDiagnostics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [audioStatus, setAudioStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});

  useEffect(() => {
    // Only show in development
    if (import.meta.env.DEV) {
      // Initialize status
      const initialStatus: Record<string, 'loading' | 'loaded' | 'error'> = {};
      Object.keys(AUDIO_PATHS).forEach(key => {
        initialStatus[key] = 'loading';
      });
      setAudioStatus(initialStatus);

      // Test each audio file
      Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
        const audio = new Audio(path);
        
        audio.addEventListener('canplaythrough', () => {
          setAudioStatus(prev => ({ ...prev, [key]: 'loaded' }));
        });
        
        audio.addEventListener('error', () => {
          setAudioStatus(prev => ({ ...prev, [key]: 'error' }));
        });
        
        audio.load();
      });
    }
  }, []);

  const testAudio = (key: AudioKey) => {
    audioService.play(key);
  };

  const reloadAudio = (key: AudioKey) => {
    setAudioStatus(prev => ({ ...prev, [key]: 'loading' }));
    audioService.reloadAudio(key);
    
    // Test the reloaded audio
    setTimeout(() => {
      const audio = new Audio(AUDIO_PATHS[key]);
      audio.addEventListener('canplaythrough', () => {
        setAudioStatus(prev => ({ ...prev, [key]: 'loaded' }));
      });
      audio.addEventListener('error', () => {
        setAudioStatus(prev => ({ ...prev, [key]: 'error' }));
      });
      audio.load();
    }, 100);
  };

  const tryAlternativeLoading = (key: AudioKey) => {
    setAudioStatus(prev => ({ ...prev, [key]: 'loading' }));
    audioService.tryAlternativeLoading(key);
    
    // Test the alternative loaded audio
    setTimeout(() => {
      const audio = new Audio(AUDIO_PATHS[key]);
      audio.addEventListener('canplaythrough', () => {
        setAudioStatus(prev => ({ ...prev, [key]: 'loaded' }));
      });
      audio.addEventListener('error', () => {
        setAudioStatus(prev => ({ ...prev, [key]: 'error' }));
      });
      audio.load();
    }, 100);
  };

  const reloadAllAudio = () => {
    Object.keys(AUDIO_PATHS).forEach(key => {
      setAudioStatus(prev => ({ ...prev, [key]: 'loading' }));
    });
    
    audioService.reloadAllAudio();
    
    // Test all reloaded audio
    setTimeout(() => {
      Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
        const audio = new Audio(path);
        audio.addEventListener('canplaythrough', () => {
          setAudioStatus(prev => ({ ...prev, [key]: 'loaded' }));
        });
        audio.addEventListener('error', () => {
          setAudioStatus(prev => ({ ...prev, [key]: 'error' }));
        });
        audio.load();
      });
    }, 100);
  };

  // Don't render in production
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isVisible ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="opacity-70 hover:opacity-100"
        >
          🔊 Audio Debug
        </Button>
      ) : (
        <div className="bg-black/80 backdrop-blur-lg rounded-lg p-4 max-w-md max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold">Audio Diagnostics</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-white"
            >
              ✕
            </Button>
          </div>
          
          <div className="mb-3">
            <Button
              variant="primary"
              size="sm"
              onClick={reloadAllAudio}
              className="w-full mb-2"
            >
              🔄 Reload All Audio
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                Object.keys(AUDIO_PATHS).forEach(key => {
                  if (audioStatus[key] === 'error') {
                    tryAlternativeLoading(key as AudioKey);
                  }
                });
              }}
              className="w-full"
            >
              🔧 Fix Failed Audio
            </Button>
          </div>

          <div className="space-y-2">
            {Object.entries(AUDIO_PATHS).map(([key, path]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      audioStatus[key] === 'loaded' 
                        ? 'bg-green-500' 
                        : audioStatus[key] === 'error'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-white truncate" title={path}>
                    {key}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testAudio(key as AudioKey)}
                    disabled={audioStatus[key] !== 'loaded'}
                    className="text-xs"
                    title="Test playback"
                  >
                    ▶️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reloadAudio(key as AudioKey)}
                    className="text-xs"
                    title="Reload with cache busting"
                  >
                    🔄
                  </Button>
                  {audioStatus[key] === 'error' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => tryAlternativeLoading(key as AudioKey)}
                      className="text-xs"
                      title="Try alternative loading strategy"
                    >
                      🔧
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-400">
            <div>🟢 Loaded | 🟡 Loading | 🔴 Error</div>
            <div>▶️ Test | 🔄 Reload | 🔧 Alternative Load</div>
            <div className="mt-1 text-xs">
              💡 Try "🔧 Fix Failed Audio" for cache issues
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioDiagnostics;
