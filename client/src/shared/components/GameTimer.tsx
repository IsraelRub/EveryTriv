import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface GameTimerProps {
  isRunning: boolean;
  timeRemaining?: number;  // For time-limited mode
  timeElapsed: number;     // Time spent playing (for all modes)
  isGameOver: boolean;
  mode: 'time-limited' | 'question-limited' | 'unlimited';
}

export default function GameTimer({ 
  isRunning, 
  timeRemaining, 
  timeElapsed,
  isGameOver,
  mode
}: GameTimerProps) {
  const [time, setTime] = useState<{ 
    elapsed: number; 
    remaining: number | null 
  }>({
    elapsed: timeElapsed || 0,
    remaining: timeRemaining !== undefined ? timeRemaining : null
  });
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && !isGameOver) {
      interval = setInterval(() => {
        setTime(prev => {
          const newElapsed = prev.elapsed + 1;
          const newRemaining = prev.remaining !== null ? Math.max(0, prev.remaining - 1) : null;
          
          return { 
            elapsed: newElapsed, 
            remaining: newRemaining 
          };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isGameOver]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTimerColor = (): string => {
    if (mode !== 'time-limited' || time.remaining === null) return 'bg-info';
    if (time.remaining > 30) return 'bg-success';
    if (time.remaining > 10) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <motion.div 
      className="timer-container flex gap-4 mb-4 justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Time elapsed (shown for all modes) */}
      <div className="time-display flex flex-col items-center">
        <span className="text-sm font-medium text-white/80">Time Elapsed</span>
        <div className={cn("px-4 py-2 rounded-lg text-white font-bold text-xl", "bg-info")}>
          {formatTime(time.elapsed)}
        </div>
      </div>

      {/* Time remaining (only shown for time-limited mode) */}
      {mode === 'time-limited' && time.remaining !== null && (
        <div className="time-display flex flex-col items-center">
          <span className="text-sm font-medium text-white/80">Time Remaining</span>
          <motion.div 
            className={cn("px-4 py-2 rounded-lg text-white font-bold text-xl", getTimerColor())}
            animate={{ scale: time.remaining < 10 && time.remaining > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: time.remaining < 10 ? Infinity : 0 }}
          >
            {formatTime(time.remaining)}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
