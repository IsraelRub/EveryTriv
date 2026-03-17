import type { GameDifficulty } from './trivia.types';

export interface SurprisePickResult {
	topic?: string;
	difficulty?: GameDifficulty;
}
