/**
 * Audio Context Provider for EveryTriv
 * Consolidated from relationships folder for better organization
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAudio } from './audio.hooks';
import { AudioContextType } from '../types';

/**
 * Audio context for providing audio capabilities throughout the application
 */
const AudioContext = createContext<AudioContextType | null>(null);

/**
 * Audio provider component
 * Wraps the application with audio context
 */
export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audio = useAudio();
  
  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Hook to use the audio context
 * Must be used within an AudioProvider
 */
export const useAudioContext = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};
