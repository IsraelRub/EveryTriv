import { useGameTimer } from '../../hooks/useGameLogic';
import { GameTimerView } from './GameTimerView';
import { GameMode } from '@/redux/features/gameModeSlice';

interface GameTimerContainerProps {
  isRunning: boolean;
  timeElapsed: number;
  timeRemaining?: number;
  isGameOver: boolean;
  mode: GameMode;
}

export default function GameTimerContainer({
  isRunning,
  timeElapsed,
  timeRemaining,
  isGameOver,
  mode
}: GameTimerContainerProps) {
  const { formatTime } = useGameTimer();
  
  const formattedElapsed = formatTime(timeElapsed);
  const formattedRemaining = timeRemaining !== undefined ? formatTime(timeRemaining) : undefined;
  
  return (
    <GameTimerView
      isRunning={isRunning}
      formattedElapsed={formattedElapsed}
      formattedRemaining={formattedRemaining}
      isGameOver={isGameOver}
      mode={mode}
    />
  );
}
