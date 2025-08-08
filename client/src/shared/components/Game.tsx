import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TriviaQuestion } from '../types';
import TriviaGame from './TriviaGame';
import GameTimer from './GameTimer';
import { Button } from '../styles/ui';

interface GameProps {
  trivia: TriviaQuestion | null;
  selected: number | null;
  onAnswer: (index: number) => void;
  onNewQuestion: () => Promise<void>;
  gameMode: {
    mode: 'time-limited' | 'question-limited' | 'unlimited';
    timeLimit?: number;
    questionLimit?: number;
    timeRemaining?: number;
    questionsRemaining?: number;
    isGameOver: boolean;
    timer: {
      isRunning: boolean;
      startTime: number | null;
      timeElapsed: number;
    }
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
  
  // Update time elapsed
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (gameMode.timer.isRunning && !isGameOver) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        
        // Update time remaining for time-limited mode
        if (gameMode.mode === 'time-limited' && timeRemaining !== undefined) {
          const newTimeRemaining = Math.max(0, timeRemaining - 1);
          setTimeRemaining(newTimeRemaining);
          
          // End game when time is up
          if (newTimeRemaining === 0) {
            setIsGameOver(true);
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameMode.timer.isRunning, isGameOver, gameMode.mode, timeRemaining]);
  
  // Handle game over
  useEffect(() => {
    if (isGameOver) {
      onGameEnd();
    }
  }, [isGameOver, onGameEnd]);
  
  // Load next question automatically when current question is answered
  useEffect(() => {
    if (selected !== null && !isGameOver) {
      const timer = setTimeout(() => {
        if (gameMode.mode === 'question-limited' && gameMode.questionsRemaining !== undefined) {
          // Check if we've reached the question limit
          if (gameMode.questionsRemaining <= 1) {
            setIsGameOver(true);
          } else {
            onNewQuestion();
          }
        } else if (gameMode.mode === 'unlimited' || gameMode.mode === 'time-limited') {
          // In time-limited or unlimited mode, just keep going
          if (gameMode.mode !== 'time-limited' || (timeRemaining !== undefined && timeRemaining > 0)) {
            onNewQuestion();
          }
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selected, onNewQuestion, gameMode.mode, gameMode.questionsRemaining, isGameOver, timeRemaining]);
  
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
    if (gameMode.mode === 'question-limited' && gameMode.questionsRemaining !== undefined) {
      return (
        <div className="game-info p-2 bg-white/10 rounded-lg mb-4">
          <p className="text-center text-white font-semibold">
            Questions remaining: {gameMode.questionsRemaining}
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
