import { motion } from 'framer-motion';
import { GameMode } from '@/redux/features/gameModeSlice';

interface GameTimerViewProps {
  isRunning: boolean;
  formattedElapsed: string;
  formattedRemaining?: string;
  isGameOver: boolean;
  mode: GameMode;
}

export function GameTimerView({
  formattedElapsed,
  formattedRemaining,
  isGameOver,
  mode
}: GameTimerViewProps) {
  // Determine what to display based on game mode
  const getTimerDisplay = () => {
    if (mode === 'time-limited') {
      return (
        <div className="flex justify-between">
          <div>Elapsed: {formattedElapsed}</div>
          <div className={`font-bold ${formattedRemaining === '0:00' || isGameOver ? 'text-red-500' : ''}`}>
            Remaining: {formattedRemaining || '0:00'}
          </div>
        </div>
      );
    } else {
      return <div>Time: {formattedElapsed}</div>;
    }
  };
  
  return (
    <motion.div 
      className="game-timer bg-white/10 p-2 rounded-lg mb-4 text-white text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {getTimerDisplay()}
    </motion.div>
  );
}
