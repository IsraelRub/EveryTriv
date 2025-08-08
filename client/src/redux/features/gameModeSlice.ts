import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export type GameMode = 'time-limited' | 'question-limited' | 'unlimited';

export interface GameModeState {
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
  }
}

const initialState: GameModeState = {
  mode: 'question-limited',
  questionLimit: 20,
  timeLimit: 60,
  questionsRemaining: 20,
  timeRemaining: 60,
  isGameOver: false,
  timer: {
    isRunning: false,
    startTime: null,
    timeElapsed: 0
  }
};

export const gameModeSlice = createSlice({
  name: 'gameMode',
  initialState,
  reducers: {
    setGameMode: (state, action: PayloadAction<{
      mode: GameMode;
      timeLimit?: number;
      questionLimit?: number;
    }>) => {
      const { mode, timeLimit, questionLimit } = action.payload;
      state.mode = mode;
      
      if (mode === 'time-limited' && timeLimit !== undefined) {
        state.timeLimit = timeLimit;
        state.timeRemaining = timeLimit;
      } else {
        state.timeLimit = undefined;
        state.timeRemaining = undefined;
      }
      
      if (mode === 'question-limited' && questionLimit !== undefined) {
        state.questionLimit = questionLimit;
        state.questionsRemaining = questionLimit;
      } else {
        state.questionLimit = undefined;
        state.questionsRemaining = undefined;
      }
      
      state.isGameOver = false;
    },
    startGame: (state) => {
      state.timer.isRunning = true;
      state.timer.startTime = Date.now();
      state.isGameOver = false;
    },
    pauseGame: (state) => {
      state.timer.isRunning = false;
    },
    endGame: (state) => {
      state.isGameOver = true;
      state.timer.isRunning = false;
    },
    updateTimeElapsed: (state, action: PayloadAction<number>) => {
      state.timer.timeElapsed = action.payload;
      
      // Update time remaining for time-limited mode
      if (state.mode === 'time-limited' && state.timeRemaining !== undefined) {
        state.timeRemaining = Math.max(0, state.timeLimit! - action.payload);
        
        // End game if time is up
        if (state.timeRemaining === 0) {
          state.isGameOver = true;
          state.timer.isRunning = false;
        }
      }
    },
    decrementQuestion: (state) => {
      if (state.mode === 'question-limited' && state.questionsRemaining !== undefined) {
        state.questionsRemaining = Math.max(0, state.questionsRemaining - 1);
        
        // End game if questions are done
        if (state.questionsRemaining === 0) {
          state.isGameOver = true;
          state.timer.isRunning = false;
        }
      }
    },
    resetGame: () => initialState
  }
});

export const {
  setGameMode,
  startGame,
  pauseGame,
  endGame,
  updateTimeElapsed,
  decrementQuestion,
  resetGame
} = gameModeSlice.actions;

export const selectGameMode = (state: RootState) => state.gameMode;

export default gameModeSlice.reducer;
