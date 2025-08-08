import { useEffect } from 'react';
import { GameView } from './GameView';
import { TriviaQuestion } from '../../types';
import { useGameMode, useGameNavigation, useGameTimer } from '../../hooks/useGameLogic';

interface GameContainerProps {
  trivia: TriviaQuestion | null;
  selected: number | null;
  onAnswer: (index: number) => void;
  onNewQuestion: () => Promise<void>;
  onGameEnd: () => void;
}

export default function GameContainer({
  trivia,
  selected,
  onAnswer,
  onNewQuestion,
  onGameEnd
}: GameContainerProps) {
  const { gameMode, isGameOver } = useGameMode();
  const { handleQuestionComplete, questionsRemaining } = useGameNavigation(onGameEnd);
  const { timeElapsed, timeRemaining, formatTime } = useGameTimer();
  
  // Handle game over
  useEffect(() => {
    if (isGameOver) {
      onGameEnd();
    }
  }, [isGameOver, onGameEnd]);
  
  // Load next question automatically when current question is answered
  useEffect(() => {
    if (selected !== null && !isGameOver) {
      const timer = setTimeout(async () => {
        const shouldContinue = handleQuestionComplete();
        if (shouldContinue) {
          await onNewQuestion();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selected, onNewQuestion, handleQuestionComplete, isGameOver]);
  
  return (
    <GameView 
      trivia={trivia}
      selected={selected}
      onAnswer={onAnswer}
      gameMode={gameMode}
      timeElapsed={timeElapsed}
      timeRemaining={timeRemaining}
      questionsRemaining={questionsRemaining}
      isGameOver={isGameOver}
      formatTime={formatTime}
    />
  );
}
