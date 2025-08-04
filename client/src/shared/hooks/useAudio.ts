import { useEffect, useCallback } from 'react';
import { AudioService } from '../services/audio.service';

// סינגלטון של שירות השמע
const audioService = new AudioService();

export const useAudio = () => {
  useEffect(() => {
    // טעינת העדפות המשתמש מה-localStorage
    const isMuted = localStorage.getItem('audioMuted') === 'true';
    const volume = parseFloat(localStorage.getItem('audioVolume') || '0.7');

    if (isMuted) {
      audioService.mute();
    } else {
      audioService.setMasterVolume(volume);
    }

    return () => {
      // ניקוי בעת יציאה מהקומפוננטה
      audioService.stopAll();
    };
  }, []);

  const playSound = useCallback((key: 'background' | 'correct' | 'wrong' | 'newUser' | 'click' | 'hover') => {
    audioService.play(key);
  }, []);

  const stopSound = useCallback((key: 'background' | 'correct' | 'wrong' | 'newUser' | 'click' | 'hover') => {
    audioService.stop(key);
  }, []);

  const toggleMute = useCallback(() => {
    audioService.toggleMute();
    localStorage.setItem('audioMuted', String(audioService.isMuted));
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioService.setMasterVolume(volume);
    localStorage.setItem('audioVolume', String(volume));
  }, []);

  return {
    playSound,
    stopSound,
    toggleMute,
    setVolume
  };
};