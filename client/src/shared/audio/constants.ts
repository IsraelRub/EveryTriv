/**
 * Audio constants for EveryTriv
 * Contains all audio types and paths
 */

// Audio categories for better organization
export enum AudioCategory {
  MUSIC = 'music',
  UI = 'ui',
  GAMEPLAY = 'gameplay',
  ACHIEVEMENT = 'achievement',
}

// All available audio keys
export enum AudioKey {
  // Background music
  BACKGROUND_MUSIC = 'background',
  GAME_MUSIC = 'game',
  
  // UI sounds
  CLICK = 'click',
  
  // Gameplay sounds
  CORRECT_ANSWER = 'correct',
  WRONG_ANSWER = 'wrong',
  GAME_START = 'gameStart',
  GAME_END = 'gameEnd',
  COUNTDOWN = 'countdown',
  POINT_EARNED = 'pointEarned',
  POINT_STREAK = 'pointStreak',
  
  // Achievement sounds
  NEW_ACHIEVEMENT = 'newAchievement',
  NEW_USER = 'newUser',
  LEVEL_UP = 'levelUp',
}

// Maps each audio key to its file path
export const AUDIO_PATHS: Record<AudioKey, string> = {
  // Music
  [AudioKey.BACKGROUND_MUSIC]: '/assets/audio/music/general.mp3',
  [AudioKey.GAME_MUSIC]: '/assets/audio/music/game.mp3',
  
  // UI sounds
  [AudioKey.CLICK]: '/assets/audio/ui/click.wav',
  
  // Gameplay sounds
  [AudioKey.CORRECT_ANSWER]: '/assets/audio/gameplay/correct-answer.wav',
  [AudioKey.WRONG_ANSWER]: '/assets/audio/gameplay/wrong-answer.wav',
  [AudioKey.GAME_START]: '/assets/audio/gameplay/beep.wav',
  [AudioKey.GAME_END]: '/assets/audio/achievements/win.wav',
  [AudioKey.COUNTDOWN]: '/assets/audio/gameplay/beep.wav',
  [AudioKey.POINT_EARNED]: '/assets/audio/gameplay/correct-answer.wav',
  [AudioKey.POINT_STREAK]: '/assets/audio/achievements/win.wav',
  
  // Achievement sounds
  [AudioKey.NEW_ACHIEVEMENT]: '/assets/audio/achievements/win.wav',
  [AudioKey.NEW_USER]: '/assets/audio/gameplay/correct-answer.wav',
  [AudioKey.LEVEL_UP]: '/assets/audio/achievements/win.wav',
};

// Maps each audio key to its category
export const AUDIO_CATEGORIES: Record<AudioKey, AudioCategory> = {
  // Music
  [AudioKey.BACKGROUND_MUSIC]: AudioCategory.MUSIC,
  [AudioKey.GAME_MUSIC]: AudioCategory.MUSIC,
  
  // UI sounds
  [AudioKey.CLICK]: AudioCategory.UI,
  
  // Gameplay sounds
  [AudioKey.CORRECT_ANSWER]: AudioCategory.GAMEPLAY,
  [AudioKey.WRONG_ANSWER]: AudioCategory.GAMEPLAY,
  [AudioKey.GAME_START]: AudioCategory.GAMEPLAY,
  [AudioKey.GAME_END]: AudioCategory.GAMEPLAY,
  [AudioKey.COUNTDOWN]: AudioCategory.GAMEPLAY,
  [AudioKey.POINT_EARNED]: AudioCategory.GAMEPLAY,
  [AudioKey.POINT_STREAK]: AudioCategory.GAMEPLAY,
  
  // Achievement sounds
  [AudioKey.NEW_ACHIEVEMENT]: AudioCategory.ACHIEVEMENT,
  [AudioKey.NEW_USER]: AudioCategory.ACHIEVEMENT,
  [AudioKey.LEVEL_UP]: AudioCategory.ACHIEVEMENT,
};

// Default volumes by category
export const DEFAULT_VOLUMES: Record<AudioCategory, number> = {
  [AudioCategory.MUSIC]: 0.3,
  [AudioCategory.UI]: 0.5,
  [AudioCategory.GAMEPLAY]: 0.7,
  [AudioCategory.ACHIEVEMENT]: 0.7,
};

// Audio configuration for special cases
export const AUDIO_CONFIG: Partial<Record<AudioKey, { loop?: boolean; volume?: number }>> = {
  [AudioKey.BACKGROUND_MUSIC]: { loop: true, volume: 0.3 },
  [AudioKey.GAME_MUSIC]: { loop: true, volume: 0.25 },
};
