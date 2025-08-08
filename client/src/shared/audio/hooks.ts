import { useEffect, useCallback, useState } from 'react';
import { audioService } from '../services/audio.service';
import { AudioKey, AudioCategory } from './constants';
import { AudioContextType } from './types';

/**
 * Hook for using audio in components
 * Provides methods for playing sounds, controlling volume, and muting
 */
export const useAudio = (): AudioContextType => {
  const [isMuted, setIsMuted] = useState(() => 
    localStorage.getItem('audioMuted') === 'true'
  );

  useEffect(() => {
    // Load user preferences from localStorage
    const storedMuted = localStorage.getItem('audioMuted') === 'true';
    const storedVolume = parseFloat(localStorage.getItem('audioVolume') || '0.7');
    
    // Apply stored preferences
    if (storedMuted) {
      audioService.mute();
      setIsMuted(true);
    } else {
      audioService.unmute();
      audioService.setMasterVolume(storedVolume);
      setIsMuted(false);
    }

    // Apply category volumes if available
    Object.values(AudioCategory).forEach(category => {
      const categoryVolume = localStorage.getItem(`audio_${category}Volume`);
      if (categoryVolume) {
        audioService.setCategoryVolume(category, parseFloat(categoryVolume));
      }
    });

    return () => {
      // Cleanup on unmount
      audioService.stopAll();
    };
  }, []);

  const playSound = useCallback((key: AudioKey) => {
    audioService.play(key);
  }, []);

  const stopSound = useCallback((key: AudioKey) => {
    audioService.stop(key);
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = audioService.toggleMute();
    setIsMuted(newMutedState);
    localStorage.setItem('audioMuted', String(newMutedState));
    return newMutedState;
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioService.setMasterVolume(volume);
    localStorage.setItem('audioVolume', String(volume));
  }, []);

  const setCategoryVolume = useCallback((category: AudioCategory, volume: number) => {
    audioService.setCategoryVolume(category, volume);
    localStorage.setItem(`audio_${category}Volume`, String(volume));
  }, []);

  return {
    playSound,
    stopSound,
    toggleMute,
    setVolume,
    setCategoryVolume,
    isMuted
  };
};

/**
 * Hook for game music
 * Switches from background music to game music during gameplay
 */
export const useGameMusic = (isGameActive: boolean) => {
  const { playSound, stopSound } = useAudio();

  useEffect(() => {
    if (isGameActive) {
      // Stop background music and play game music
      stopSound(AudioKey.BACKGROUND_MUSIC);
      playSound(AudioKey.GAME_MUSIC);
    } else {
      // Stop game music - background music will be started on user interaction
      stopSound(AudioKey.GAME_MUSIC);
      // Only try to play background music if user has already interacted
      // The audio service will handle this automatically
    }

    return () => {
      // Make sure to clean up
      stopSound(AudioKey.GAME_MUSIC);
    };
  }, [isGameActive, playSound, stopSound]);
};

/**
 * Hook for UI sound effects with gesture animations
 * Provides common sound effects for UI interactions
 */
export const useUIAudio = () => {
  const { playSound } = useAudio();

  const playClick = useCallback(() => playSound(AudioKey.CLICK), [playSound]);
  const playSwipe = useCallback(() => playSound(AudioKey.SWIPE), [playSound]);
  const playPop = useCallback(() => playSound(AudioKey.POP), [playSound]);
  const playWhoosh = useCallback(() => playSound(AudioKey.WHOOSH), [playSound]);

  return {
    playClick,
    playSwipe,
    playPop,
    playWhoosh,
    playSound, // For custom audio keys
  };
};
