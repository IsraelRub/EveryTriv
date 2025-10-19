/**
 * UI constants for EveryTriv client
 * Defines theme, styling, and UI-related constants
 *
 * @module UIConstants
 * @description UI configuration constants
 * @used_by client/components, client/src/hooks, client/services
 */
import { DifficultyLevel, UI_THEME_VARIANTS } from '@shared/constants';

export const Theme = UI_THEME_VARIANTS;

export const DIFFICULTY_LEVELS_UI = [
  {
    id: DifficultyLevel.EASY,
    label: 'Easy',
    description: 'Beginner friendly',
    color: 'text-green-500',
  },
  {
    id: DifficultyLevel.MEDIUM,
    label: 'Medium',
    description: 'Balanced challenge',
    color: 'text-yellow-500',
  },
  {
    id: DifficultyLevel.HARD,
    label: 'Hard',
    description: 'Expert level',
    color: 'text-red-500',
  },
] as const;
