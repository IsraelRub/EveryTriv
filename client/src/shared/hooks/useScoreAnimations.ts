import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for playing achievement animations based on score changes
 * @param score Current score
 * @param total Total questions answered
 * @deprecated Use useAdvancedScoreAnimations from useAdvancedAnimations.ts for more features
 */
export const useScoreAnimations = (score: number, total: number) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const prevScore = useRef(score);
  const prevTotal = useRef(total);
  
  useEffect(() => {
    // Only run effect if scores have changed
    if (prevTotal.current !== total && score > prevScore.current) {
      // Show confetti on certain achievements
      if (score % 10 === 0 && score > 0) {
        // Show confetti on multiples of 10
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (score % 5 === 0 && score > 0) {
        // Show confetti on multiples of 5
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
      
      // Update refs with current values
      prevScore.current = score;
      prevTotal.current = total;
    }
  }, [score, total]);

  return { showConfetti };
};
