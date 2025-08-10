import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { GameMode } from '../../types';

interface GameTimerProps {
  isRunning: boolean;
  timeRemaining?: number;  // For time-limited mode
  timeElapsed: number;     // Time spent playing (for all modes)
  isGameOver: boolean;
  mode: GameMode;
  className?: string;
}

export default function GameTimer({ 
  isRunning, 
  timeRemaining, 
  timeElapsed,
  isGameOver,
  mode,
  className
}: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeElapsed);
  
  useEffect(() => {
    if (!isRunning || isGameOver) return;
    
    const interval = setInterval(() => {
      setDisplayTime(prev => prev + 1000);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, isGameOver]);
  
  // Format time to MM:SS or HH:MM:SS
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine what to display based on game mode
  const getTimerDisplay = () => {
    const formattedElapsed = formatTime(displayTime);
    
    if (mode === GameMode.TIME_LIMITED) {
      const formattedRemaining = timeRemaining !== undefined ? formatTime(timeRemaining) : '0:00';
      const isTimeRunningOut = timeRemaining !== undefined && timeRemaining < 30000; // Less than 30 seconds
      
      return (
        <div className="flex justify-between items-center">
          <div className="text-sm opacity-75">
            Elapsed: <span className="font-medium">{formattedElapsed}</span>
          </div>
          <div className={cn(
            "font-bold text-lg",
            {
              "text-red-400 animate-pulse": isTimeRunningOut || isGameOver,
              "text-white": !isTimeRunningOut && !isGameOver
            }
          )}>
            {isGameOver ? "TIME'S UP!" : `${formattedRemaining}`}
          </div>
        </div>
      );
    } else if (mode === GameMode.QUESTION_LIMITED) {
      return (
        <div className="text-center">
          <div className="text-sm opacity-75">Time Playing</div>
          <div className="font-bold text-lg text-white">
            {formattedElapsed}
          </div>
        </div>
      );
    } else {
      // Unlimited mode
      return (
        <div className="text-center">
          <div className="text-sm opacity-75">Session Time</div>
          <div className="font-bold text-lg text-white">
            {formattedElapsed}
          </div>
        </div>
      );
    }
  };
  
  // Don't show timer if not in an active game
  if (!isRunning && timeElapsed === 0) {
    return null;
  }
  
  return (
    <motion.div 
      className={cn(
        "game-timer bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg mb-4 text-white",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {getTimerDisplay()}
      
      {/* Game mode indicator */}
      <div className="text-xs opacity-60 text-center mt-1">
        {mode === GameMode.TIME_LIMITED && "Time Limited"}
        {mode === GameMode.QUESTION_LIMITED && "Question Limited"}
        {mode === GameMode.UNLIMITED && "Free Play"}
      </div>
    </motion.div>
  );
}
