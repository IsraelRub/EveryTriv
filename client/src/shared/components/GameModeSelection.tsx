import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../styles/ui';
import { cn } from '../utils/cn';

interface GameModeSelectionProps {
  onSelect: (config: {
    mode: 'time-limited' | 'question-limited' | 'unlimited';
    timeLimit?: number;
    questionLimit?: number;
  }) => void;
}

export default function GameModeSelection({ onSelect }: GameModeSelectionProps) {
  const [mode, setMode] = useState<'time-limited' | 'question-limited' | 'unlimited'>('question-limited');
  const [timeLimit, setTimeLimit] = useState(60); // Default 60 seconds (1 minute)
  const [questionLimit, setQuestionLimit] = useState(20); // Default 20 questions
  
  const handleTimeChange = (value: number) => {
    setTimeLimit(Math.max(10, value));
  };
  
  const handleQuestionChange = (value: number) => {
    setQuestionLimit(Math.max(1, value));
  };
  
  const handleSubmit = () => {
    onSelect({
      mode,
      timeLimit: mode === 'time-limited' ? timeLimit : undefined,
      questionLimit: mode === 'question-limited' ? questionLimit : undefined,
    });
  };
  
  return (
    <motion.div 
      className="game-mode-selection glass-morphism p-4 rounded-lg mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-bold text-white mb-3">Select Game Mode</h3>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <Button 
          variant={mode === 'time-limited' ? 'primary' : 'ghost'} 
          className={cn("flex-1", mode === 'time-limited' ? '' : 'text-white')}
          onClick={() => setMode('time-limited')}
        >
          ⏱️ Time Limited
        </Button>
        
        <Button 
          variant={mode === 'question-limited' ? 'primary' : 'ghost'} 
          className={cn("flex-1", mode === 'question-limited' ? '' : 'text-white')}
          onClick={() => setMode('question-limited')}
        >
          📋 Question Limited
        </Button>
        
        <Button 
          variant={mode === 'unlimited' ? 'primary' : 'ghost'} 
          className={cn("flex-1", mode === 'unlimited' ? '' : 'text-white')}
          onClick={() => setMode('unlimited')}
        >
          🔄 Unlimited
        </Button>
      </div>
      
      {mode === 'time-limited' && (
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Time Limit (seconds)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              min={10}
              step={10}
              value={timeLimit} 
              onChange={(e) => handleTimeChange(parseInt(e.target.value, 10))}
              className="flex-1 rounded p-2 bg-slate-700 text-white border border-slate-600" 
            />
            <span className="text-white font-bold">
              {timeLimit >= 60 ? `${Math.floor(timeLimit / 60)}m ${timeLimit % 60}s` : `${timeLimit}s`}
            </span>
          </div>
        </div>
      )}
      
      {mode === 'question-limited' && (
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Question Limit</label>
          <input 
            type="number"
            min={1} 
            value={questionLimit} 
            onChange={(e) => handleQuestionChange(parseInt(e.target.value, 10))}
            className="w-full rounded p-2 bg-slate-700 text-white border border-slate-600"
          />
        </div>
      )}
      
      {mode === 'unlimited' && (
        <p className="text-white/80 mb-4 text-sm">
          Play unlimited questions until you decide to stop. The game will continue as long as you have enough tokens.
        </p>
      )}
      
      <Button 
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
      >
        Start Game
      </Button>
    </motion.div>
  );
}
