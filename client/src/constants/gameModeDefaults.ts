/**
 * Game Mode Default Settings
 * @description Centralized default settings for all game modes
 * @used_by client/src/redux/features, client/src/components/gameMode
 */

import { GameMode } from '@shared';

import { GameModeDefaults } from '../types/game/config.types';

/**
 * Get default settings for a specific game mode
 * @param mode - The game mode
 * @returns Default settings for the mode
 */
export const getGameModeDefaults = (mode: GameMode): GameModeDefaults => {
  switch (mode) {
    case GameMode.QUESTION_LIMITED:
      return { timeLimit: 0, questionLimit: 10 };
    case GameMode.TIME_LIMITED:
      return { timeLimit: 60, questionLimit: 999 };
    case GameMode.UNLIMITED:
      return { timeLimit: 0, questionLimit: 999 };
    default:
      return { timeLimit: 0, questionLimit: 10 };
  }
};

/**
 * Default game mode
 */
export const DEFAULT_GAME_MODE = GameMode.QUESTION_LIMITED;
