import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateTimeElapsed, 
  decrementQuestion, 
  startGame, 
  endGame, 
  selectGameMode, 
  resetGame,
  setGameMode as setGameModeAction,
  GameMode
} from '@/redux/features/gameModeSlice';

export function useGameTimer() {
  const dispatch = useDispatch();
  const gameMode = useSelector(selectGameMode);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Start/stop timer based on game mode state
  useEffect(() => {
    if (gameMode.timer.isRunning && !gameMode.isGameOver) {
      // Clear any existing timer
      if (timerId) clearInterval(timerId);
      
      // Start a new timer that updates every second
      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - (gameMode.timer.startTime || Date.now())) / 1000);
        dispatch(updateTimeElapsed(elapsedSeconds));
      }, 1000);
      
      setTimerId(interval);
    } else if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    // Cleanup on unmount
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameMode.timer.isRunning, gameMode.isGameOver, gameMode.timer.startTime, dispatch, timerId]);

  // Format time for display
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isRunning: gameMode.timer.isRunning,
    timeElapsed: gameMode.timer.timeElapsed,
    timeRemaining: gameMode.timeRemaining,
    formatTime
  };
}

export function useGameMode() {
  const dispatch = useDispatch();
  const gameMode = useSelector(selectGameMode);
  
  const setGameMode = useCallback((config: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
  }) => {
    dispatch(setGameModeAction(config));
  }, [dispatch]);
  
  const startGameSession = useCallback(() => {
    dispatch(startGame());
  }, [dispatch]);
  
  const endGameSession = useCallback(() => {
    dispatch(endGame());
  }, [dispatch]);
  
  const resetGameSession = useCallback(() => {
    dispatch(resetGame());
  }, [dispatch]);
  
  const handleQuestionAnswered = useCallback(() => {
    if (gameMode.mode === 'question-limited') {
      dispatch(decrementQuestion());
    }
  }, [dispatch, gameMode.mode]);
  
  return {
    gameMode,
    setGameMode,
    startGameSession,
    endGameSession,
    resetGameSession,
    handleQuestionAnswered,
    isGameOver: gameMode.isGameOver
  };
}

export function useGameNavigation(onGameOver: () => void) {
  const { gameMode, handleQuestionAnswered } = useGameMode();
  
  // Handle navigation after answering a question
  const handleQuestionComplete = useCallback(() => {
    // Update question count
    handleQuestionAnswered();
    
    // Check if game should end based on game mode
    if (gameMode.isGameOver) {
      onGameOver();
      return false; // Don't load next question
    }
    
    // For unlimited mode, always continue
    if (gameMode.mode === 'unlimited') {
      return true; // Load next question
    }
    
    // For time-limited mode, continue if time remaining
    if (gameMode.mode === 'time-limited') {
      return gameMode.timeRemaining !== undefined && gameMode.timeRemaining > 0;
    }
    
    // For question-limited mode, continue if questions remaining
    if (gameMode.mode === 'question-limited') {
      return gameMode.questionsRemaining !== undefined && gameMode.questionsRemaining > 0;
    }
    
    return false;
  }, [gameMode, handleQuestionAnswered, onGameOver]);
  
  return {
    handleQuestionComplete,
    questionsRemaining: gameMode.questionsRemaining
  };
}
