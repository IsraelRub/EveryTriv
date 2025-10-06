import { formatTimeDisplay } from '@shared/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { GameTimerProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { fadeInDown } from '../animations';

/**
 * Game timer component with mode-specific display
 *
 * @component GameTimer
 * @description Timer component that displays elapsed time, remaining time, and game mode indicators
 * @param isRunning - Whether the timer is currently running
 * @param timeRemaining - Remaining time in milliseconds (for time-limited mode)
 * @param timeElapsed - Elapsed time in milliseconds
 * @param isGameOver - Whether the game has ended
 * @param mode - Current game mode
 * @param className - Additional CSS classes
 * @returns JSX.Element The rendered timer component or null if not active
 */
export default function GameTimer({
  isRunning,
  timeRemaining,
  timeElapsed,
  isGameOver,
  mode,
  className,
}: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeElapsed ?? 0);

  useEffect(() => {
    if (!isRunning || isGameOver) return;

    const interval = setInterval(() => {
      setDisplayTime((prev: number) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isGameOver]);

  const getTimerDisplay = () => {
    const formattedElapsed = formatTimeDisplay(displayTime ?? 0);

    if (mode?.name === 'time-limited') {
      const formattedRemaining = timeRemaining ? formatTimeDisplay(timeRemaining) : '0:00';
      const isTimeRunningOut = timeRemaining && timeRemaining < 30000; // Less than 30 seconds

      return (
        <div className='flex justify-between items-center'>
          <div className='text-sm opacity-75'>
            Elapsed: <span className='font-medium'>{formattedElapsed}</span>
          </div>
          <div
            className={combineClassNames('font-bold text-lg', {
              'text-red-400 animate-pulse': isTimeRunningOut || isGameOver,
              'text-white': !isTimeRunningOut && !isGameOver,
            })}
          >
            {isGameOver ? "TIME'S UP!" : `${formattedRemaining}`}
          </div>
        </div>
      );
    } else if (mode?.name === 'question-limited') {
      return (
        <div className='text-center'>
          <div className='text-sm opacity-75'>Time Playing</div>
          <div className='font-bold text-lg text-white'>{formattedElapsed}</div>
        </div>
      );
    } else {
      return (
        <div className='text-center'>
          <div className='text-sm opacity-75'>Session Time</div>
          <div className='font-bold text-lg text-white'>{formattedElapsed}</div>
        </div>
      );
    }
  };

  if (!isRunning && timeElapsed === 0) {
    return null;
  }

  return (
    <motion.div
      variants={fadeInDown}
      initial='hidden'
      animate='visible'
      className={combineClassNames(
        'game-timer bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg mb-4 text-white',
        className
      )}
    >
      {getTimerDisplay()}

      {/* Game mode indicator */}
      <div className='text-xs opacity-60 text-center mt-1'>
        {mode?.name === 'time-limited' && 'Time Limited'}
        {mode?.name === 'question-limited' && 'Question Limited'}
        {mode?.name === 'unlimited' && 'Free Play'}
      </div>
    </motion.div>
  );
}
