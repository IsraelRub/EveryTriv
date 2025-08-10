import { useEffect, useRef } from 'react';
import { AudioKey } from '../constants/audio.constants';
import { useAudioContext } from './audio.context';

/**
 * Custom hook for playing achievement sounds based on score changes
 * @param score Current score
 * @param total Total questions answered
 */
export const useScoreAchievementSounds = (score: number, total: number): void => {
  const { playSound } = useAudioContext();
  const prevScore = useRef(score);
  const prevTotal = useRef(total);
  
  useEffect(() => {
    // Only run effect if scores have changed
    if (prevTotal.current !== total) {
      // Play achievement sound on certain milestones
      if (score > prevScore.current) {
        // Check for streaks (consecutive correct answers)
        const streak = score - prevScore.current;
        if (streak >= 3) {
          // Play streak sound for 3 or more consecutive correct answers
          playSound(AudioKey.POINT_STREAK);
        } else if (score % 5 === 0 && score > 0) {
          // Play achievement sound on multiples of 5
          playSound(AudioKey.NEW_ACHIEVEMENT);
        } else if (score % 10 === 0 && score > 0) {
          // Play level up sound on multiples of 10
          playSound(AudioKey.LEVEL_UP);
        } else {
          // Play regular point sound
          playSound(AudioKey.POINT_EARNED);
        }
      }
      
      // Update refs with current values
      prevScore.current = score;
      prevTotal.current = total;
    }
  }, [score, total, playSound]);
};
