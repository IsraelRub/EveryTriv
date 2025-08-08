import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { GameModeSelectionView } from './GameModeSelectionView';
import { setGameMode } from '@/redux/features/gameModeSlice';
import { GameMode } from '@/redux/features/gameModeSlice';

interface GameModeSelectionContainerProps {
  onSelect: (config: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
  }) => void;
}

export default function GameModeSelectionContainer({ onSelect }: GameModeSelectionContainerProps) {
  const [mode, setModeState] = useState<GameMode>('question-limited');
  const [timeLimit, setTimeLimit] = useState(60); // Default 60 seconds (1 minute)
  const [questionLimit, setQuestionLimit] = useState(20); // Default 20 questions
  const dispatch = useDispatch();
  
  const handleTimeChange = (value: number) => {
    setTimeLimit(Math.max(10, value));
  };
  
  const handleQuestionChange = (value: number) => {
    setQuestionLimit(Math.max(1, value));
  };
  
  const handleModeChange = (newMode: GameMode) => {
    setModeState(newMode);
  };
  
  const handleSubmit = () => {
    const config = {
      mode,
      timeLimit: mode === 'time-limited' ? timeLimit : undefined,
      questionLimit: mode === 'question-limited' ? questionLimit : undefined,
    };
    
    // Update the Redux store
    dispatch(setGameMode(config));
    
    // Call the parent component's callback
    onSelect(config);
  };
  
  return (
    <GameModeSelectionView 
      mode={mode}
      timeLimit={timeLimit}
      questionLimit={questionLimit}
      onModeChange={handleModeChange}
      onTimeChange={handleTimeChange}
      onQuestionChange={handleQuestionChange}
      onSubmit={handleSubmit}
    />
  );
}
