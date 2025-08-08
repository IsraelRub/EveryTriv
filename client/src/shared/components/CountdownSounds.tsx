import { useEffect, useRef } from 'react';
import { useAudioContext } from '../audio';
import { AudioKey } from '../audio/constants';

interface CountdownSoundsProps {
  seconds: number;
  isActive: boolean;
  onComplete?: () => void;
}

/**
 * Component that plays countdown sounds based on remaining time
 * 
 * @example
 * // In a trivia component with a timer:
 * const [timeLeft, setTimeLeft] = useState(30);
 * const [isActive, setIsActive] = useState(true);
 * 
 * // Then in the JSX:
 * <CountdownSounds 
 *   seconds={timeLeft} 
 *   isActive={isActive}
 *   onComplete={() => console.log('Time up!')}
 * />
 */
export const CountdownSounds: React.FC<CountdownSoundsProps> = ({ 
  seconds, 
  isActive,
  onComplete 
}) => {
  const { playSound } = useAudioContext();
  const prevSeconds = useRef(seconds);
  
  useEffect(() => {
    // Only play sounds when countdown is active
    if (!isActive) return;
    
    // Play countdown sound for last 5 seconds
    if (seconds <= 5 && seconds > 0 && prevSeconds.current !== seconds) {
      playSound(AudioKey.COUNTDOWN);
    }
    
    // Play game end sound when timer reaches zero
    if (seconds === 0 && prevSeconds.current !== 0) {
      playSound(AudioKey.GAME_END);
      if (onComplete) {
        onComplete();
      }
    }
    
    // Update ref
    prevSeconds.current = seconds;
  }, [seconds, isActive, playSound, onComplete]);
  
  // This is a behavior-only component with no UI
  return null;
};
