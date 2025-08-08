// Game mode types
export enum GameMode {
  TIME_LIMITED = 'time-limited',
  QUESTION_LIMITED = 'question-limited',
  UNLIMITED = 'unlimited'
}

export interface GameModeConfig {
  mode: GameMode;
  timeLimit?: number;  // Time in seconds for TIME_LIMITED mode
  questionLimit?: number; // Number of questions for QUESTION_LIMITED mode
}

export interface GameTimer {
  isRunning: boolean;
  startTime: number;
  currentTime: number;
  totalTime: number;
  timeElapsed: number;
  timeRemaining: number;
}

// Extended GameState to support game modes
export interface GameModeState {
  gameMode: GameMode;
  config: GameModeConfig;
  timer: GameTimer;
  questionsAnswered: number;
  questionsRemaining: number | null; // null for unlimited mode
  isGameOver: boolean;
}
