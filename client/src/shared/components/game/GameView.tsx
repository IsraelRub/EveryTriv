import { motion } from 'framer-motion';
import { TriviaQuestion } from '../../types';
import TriviaGame from '../TriviaGame';
import GameTimer from '../GameTimer';
import { Button } from '../../styles/ui';
import { GameModeState } from '@/redux/features/gameModeSlice';

interface GameViewProps {
  trivia: TriviaQuestion | null;
  selected: number | null;
  onAnswer: (index: number) => void;
  gameMode: GameModeState;
  timeElapsed: number;
  timeRemaining?: number;
  questionsRemaining?: number;
  isGameOver: boolean;
  formatTime: (seconds: number) => string;
}

export function GameView({
  trivia,
  selected,
  onAnswer,
  gameMode,
  timeElapsed,
  timeRemaining,
  questionsRemaining,
  isGameOver
}: GameViewProps) {
  
  // Render game status based on mode
  const renderGameStatus = () => {
    if (isGameOver) {
      return (
        <motion.div 
          className="game-over p-6 glass-morphism rounded-lg text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Game Over!</h2>
          <p className="text-lg text-white/80 mb-6">
            {gameMode.mode === 'time-limited' 
              ? 'Time is up!' 
              : gameMode.mode === 'question-limited' 
                ? 'You completed all questions!' 
                : 'Game completed!'}
          </p>
          <Button 
            variant="primary" 
            size="lg"
            className="mb-2"
            onClick={() => window.location.reload()}
          >
            Play Again
          </Button>
        </motion.div>
      );
    }
    
    return null;
  };
  
  // Render game status info
  const renderGameInfo = () => {
    if (gameMode.mode === 'question-limited' && questionsRemaining !== undefined) {
      return (
        <div className="game-info p-2 bg-white/10 rounded-lg mb-4">
          <p className="text-center text-white font-semibold">
            Questions remaining: {questionsRemaining}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="game-container">
      <GameTimer 
        isRunning={gameMode.timer.isRunning}
        timeElapsed={timeElapsed}
        timeRemaining={timeRemaining}
        isGameOver={isGameOver}
        mode={gameMode.mode}
      />
      
      {renderGameInfo()}
      
      {isGameOver ? (
        renderGameStatus()
      ) : (
        trivia && <TriviaGame trivia={trivia} selected={selected} onAnswer={onAnswer} />
      )}
    </div>
  );
}
