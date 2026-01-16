import type { GameDifficulty } from './trivia.types';

export interface SavedGameConfiguration extends Record<string, unknown> {
	defaultDifficulty: GameDifficulty;
	defaultTopic: string;
	questionsPerRequest: number;
	timeLimit: number;
	soundEnabled: boolean;
}
