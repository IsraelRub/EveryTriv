import { useEffect } from 'react';
import { useAudioContext } from '../context/AudioContext';

export const useBackgroundMusic = () => {
  const { playSound, stopSound } = useAudioContext();

  useEffect(() => {
    // התחלת מוזיקת רקע כשהקומפוננטה נטענת
    playSound('background');

    // עצירת המוזיקה כשהקומפוננטה מתפרקת
    return () => stopSound('background');
  }, []);
};