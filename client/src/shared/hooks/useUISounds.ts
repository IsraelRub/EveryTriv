import { useCallback } from 'react';
import { AudioKey } from '../constants/audio.constants';
import { useAudioContext } from './audio.context';

/**
 * Hook for easily adding UI sound effects to components
 * Returns a set of event handlers that can be spread onto elements
 */
export const useUISounds = () => {
  const { playSound } = useAudioContext();
  
  // Play click sound
  const handleClick = useCallback(() => {
    playSound(AudioKey.CLICK);
  }, [playSound]);
  
  // Return object with event handlers
  return {
    // For elements like buttons
    buttonProps: {
      onClick: handleClick
    },
    
    // Individual handlers for more control
    playClickSound: handleClick,
    
    // Custom handler that plays a sound and then calls original handler
    withSound: <T extends (...args: any[]) => any>(
      handler: T,
      sound: AudioKey = AudioKey.CLICK
    ) => {
      return ((...args: Parameters<T>) => {
        playSound(sound);
        return handler(...args);
      }) as T;
    }
  };
};
