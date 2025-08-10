import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import TriviaGame from './TriviaGame';
import GameTimer from './GameTimer';
import { TriviaQuestion, GameMode } from '../../types';
import { Button } from '../ui';

interface GameProps {
  trivia: TriviaQuestion | null;
  selected: number | null;
  onAnswer: (index: number) => void;
  onNewQuestion: () => Promise<void>;
  gameMode: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
    timeRemaining?: number;
    questionsRemaining?: number;
    isGameOver: boolean;
    timer: {
      isRunning: boolean;
      startTime: number | null;
      timeElapsed: number;
    };
  };
  onGameEnd: () => void;
}

export default function Game({
  trivia,
  selected,
  onAnswer,
  onNewQuestion,
  gameMode,
  onGameEnd
}: GameProps) {
  const [timeElapsed, setTimeElapsed] = useState(gameMode.timer.timeElapsed);
  const [timeRemaining, setTimeRemaining] = useState(gameMode.timeRemaining);
  const [isGameOver, setIsGameOver] = useState(gameMode.isGameOver);

  // Handle timer updates
  useEffect(() => {
    if (!gameMode.timer.isRunning || isGameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = gameMode.timer.startTime || now;
      const elapsed = now - startTime;
      
      setTimeElapsed(elapsed);

      // Handle time-limited mode
      if (gameMode.mode === GameMode.TIME_LIMITED && gameMode.timeLimit) {
        const remaining = Math.max(0, gameMode.timeLimit - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsGameOver(true);
          onGameEnd();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode.timer.isRunning, gameMode.timer.startTime, gameMode.mode, gameMode.timeLimit, isGameOver, onGameEnd]);

  // Handle question-limited mode
  useEffect(() => {
    if (gameMode.mode === GameMode.QUESTION_LIMITED && 
        gameMode.questionsRemaining !== undefined && 
        gameMode.questionsRemaining <= 0) {
      setIsGameOver(true);
      onGameEnd();
    }
  }, [gameMode.mode, gameMode.questionsRemaining, onGameEnd]);

  // Update local state when props change
  useEffect(() => {
    setIsGameOver(gameMode.isGameOver);
  }, [gameMode.isGameOver]);

  // Handle answer selection with auto-progression for limited modes
  const handleAnswer = useCallback(async (index: number) => {
    await onAnswer(index);
    
    // Auto-progress for time-limited and question-limited modes
    if ((gameMode.mode === GameMode.TIME_LIMITED || gameMode.mode === GameMode.QUESTION_LIMITED) && 
        !isGameOver) {
      setTimeout(async () => {
        if (gameMode.questionsRemaining && gameMode.questionsRemaining > 1) {
          await onNewQuestion();
        }
      }, 2000); // 2 second delay to show result
    }
  }, [onAnswer, onNewQuestion, gameMode.mode, gameMode.questionsRemaining, isGameOver]);

  // Format time to MM:SS
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render game status based on mode
  const renderGameStatus = () => {
    if (isGameOver) {
      return (
        <motion.div 
          className="game-over p-6 glass-morphism rounded-lg text-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">Game Complete!</h2>
          <p className="text-lg text-white/80 mb-6">
            {gameMode.mode === GameMode.TIME_LIMITED 
              ? `Time's up! You played for ${formatTime(timeElapsed)}` 
              : gameMode.mode === GameMode.QUESTION_LIMITED 
                ? `All questions completed in ${formatTime(timeElapsed)}!` 
                : `Great session! Time played: ${formatTime(timeElapsed)}`}
          </p>
          <div className="space-y-3">
            <Button 
              variant="primary" 
              size="lg"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              🎮 Play Again
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full text-white/70 hover:text-white"
              onClick={onGameEnd}
            >
              Return to Menu
            </Button>
          </div>
        </motion.div>
      );
    }
    
    return null;
  };
  
  // Render game progress info
  const renderGameInfo = () => {
    const info = [];
    
    if (gameMode.mode === GameMode.QUESTION_LIMITED && gameMode.questionsRemaining !== undefined) {
      info.push(
        <div key="questions" className="text-center">
          <div className="text-sm opacity-75">Questions Remaining</div>
          <div className="font-bold text-lg">{gameMode.questionsRemaining}</div>
        </div>
      );
    }
    
    if (gameMode.mode === GameMode.TIME_LIMITED && timeRemaining !== undefined) {
      const isUrgent = timeRemaining < 30000; // Less than 30 seconds
      info.push(
        <div key="time" className="text-center">
          <div className="text-sm opacity-75">Time Remaining</div>
          <div className={`font-bold text-lg ${isUrgent ? 'text-red-400 animate-pulse' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      );
    }
    
    if (info.length > 0) {
      return (
        <motion.div 
          className="game-info p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`grid grid-cols-${info.length} gap-4 text-white`}>
            {info}
          </div>
        </motion.div>
      );
    }
    
    return null;
  };

  // Handle next question for unlimited mode
  const handleNextQuestion = async () => {
    if (gameMode.mode === GameMode.UNLIMITED) {
      await onNewQuestion();
    }
  };
  
  return (
    <motion.div 
      className="game-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Game Timer */}
      <GameTimer
        isRunning={gameMode.timer.isRunning}
        timeElapsed={timeElapsed}
        timeRemaining={timeRemaining}
        isGameOver={isGameOver}
        mode={gameMode.mode}
      />
      
      {/* Game Progress Info */}
      {renderGameInfo()}
      
      {/* Game Content */}
      {isGameOver ? (
        renderGameStatus()
      ) : (
        <>
          {trivia && (
            <TriviaGame 
              trivia={trivia} 
              selected={selected} 
              onAnswer={handleAnswer} 
            />
          )}
          
          {/* Next Question Button for Unlimited Mode */}
          {selected !== null && gameMode.mode === GameMode.UNLIMITED && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                ➡️ Next Question
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
